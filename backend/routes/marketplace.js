const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const db      = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const hashIp = ip => crypto.createHash('sha256').update(ip+'rp_salt_2024').digest('hex');

// PUBLIC: browse listings
router.get('/', async (req,res) => {
  try {
    const { city,type } = req.query;
    let where = `l.status='active' AND p.listed=TRUE`;
    const params=[];
    if (city){params.push(`%${city}%`);where+=` AND p.city ILIKE $${params.length}`;}
    if (type){params.push(type);where+=` AND p.property_type=$${params.length}`;}

    const result = await db.query(
      `SELECT p.id,p.name,p.city,p.address,p.rent,p.property_type,p.bhk,p.total_rooms,
              p.floor_details,p.total_floors,p.furnishing,p.area_sqft,p.facing,p.parking,
              p.amenities,p.available_from,p.max_adults,p.description,p.house_rules,
              p.security_deposit,l.listed_at,
              COUNT(DISTINCT pv.id) AS view_count,
              COALESCE(json_agg(pi.url ORDER BY pi.created_at ASC) FILTER (WHERE pi.url IS NOT NULL),'[]') AS images
       FROM listings l
       JOIN properties p ON l.property_id=p.id
       LEFT JOIN property_views pv ON pv.property_id=p.id
       LEFT JOIN property_images pi ON pi.property_id=p.id
       WHERE ${where}
       GROUP BY p.id,l.id,l.listed_at
       ORDER BY l.listed_at DESC`,
      params
    );
    res.json(result.rows);
  } catch(err){res.status(500).json({error:err.message});}
});

// PUBLIC: single property detail
router.get('/property/:propertyId', async (req,res) => {
  try {
    const result = await db.query(
      `SELECT p.id,p.name,p.city,p.address,p.rent,p.property_type,p.bhk,p.total_rooms,
              p.floor_details,p.total_floors,p.furnishing,p.area_sqft,p.facing,p.parking,
              p.amenities,p.available_from,p.max_adults,p.description,p.house_rules,
              p.security_deposit,l.listed_at,
              COUNT(DISTINCT pv.id) AS view_count,
              COALESCE(json_agg(pi.url ORDER BY pi.created_at ASC) FILTER (WHERE pi.url IS NOT NULL),'[]') AS images
       FROM listings l
       JOIN properties p ON l.property_id=p.id
       LEFT JOIN property_views pv ON pv.property_id=p.id
       LEFT JOIN property_images pi ON pi.property_id=p.id
       WHERE p.id=$1 AND l.status='active' AND p.listed=TRUE
       GROUP BY p.id,l.id,l.listed_at`,
      [req.params.propertyId]
    );
    if (!result.rows.length) return res.status(404).json({error:'Listing not found'});
    res.json(result.rows[0]);
  } catch(err){res.status(500).json({error:err.message});}
});

// PUBLIC: record view
router.post('/property/:propertyId/view', async (req,res) => {
  try {
    const ip=req.headers['x-forwarded-for']||req.ip||'unknown';
    const ipHash=hashIp(ip);
    const recent=await db.query(
      `SELECT id FROM property_views WHERE property_id=$1 AND ip_hash=$2 AND viewed_at>NOW()-INTERVAL '24 hours'`,
      [req.params.propertyId,ipHash]
    );
    if (!recent.rows.length)
      await db.query('INSERT INTO property_views (property_id,ip_hash) VALUES ($1,$2)',[req.params.propertyId,ipHash]);
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// PUBLIC: submit enquiry
router.post('/property/:propertyId/enquire', async (req,res) => {
  const {name,email,phone,moveInDate,message}=req.body;
  if (!name||!email||!phone) return res.status(400).json({error:'Name, email and phone are required'});
  try {
    const prop=await db.query('SELECT landlord_id FROM properties WHERE id=$1 AND listed=TRUE',[req.params.propertyId]);
    if (!prop.rows.length) return res.status(404).json({error:'Property not found or not listed'});
    const r=await db.query(
      `INSERT INTO enquiries (property_id,landlord_id,name,email,phone,move_in_date,message)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [req.params.propertyId,prop.rows[0].landlord_id,name,email,phone,moveInDate||null,message||null]
    );
    await db.query(
      `INSERT INTO notifications (user_id,type,title,message,ref_id)
       SELECT u.id,'new_enquiry','New property enquiry',$1,$2 FROM users u WHERE u.role='admin'`,
      [`${name} is interested in property ${req.params.propertyId}.`,String(r.rows[0].id)]
    );
    res.status(201).json({success:true,enquiryId:r.rows[0].id});
  } catch(err){res.status(500).json({error:err.message});}
});

// LANDLORD: my listings
router.get('/landlord/my-listings', authenticate, requireRole('landlord'), async (req,res) => {
  try {
    const result=await db.query(
      `SELECT p.id,p.name,p.city,p.rent,p.property_type,p.bhk,p.total_rooms,p.floor_details,
              p.amenities,p.available_from,p.listed,p.status,p.max_adults,p.description,
              p.house_rules,p.security_deposit,l.status AS listing_status,l.listed_at,
              COUNT(DISTINCT pv.id) AS view_count,COUNT(DISTINCT e.id) AS enquiry_count,
              COALESCE(json_agg(pi.url ORDER BY pi.created_at ASC) FILTER (WHERE pi.url IS NOT NULL),'[]') AS images
       FROM properties p
       LEFT JOIN listings l        ON l.property_id=p.id
       LEFT JOIN property_views pv ON pv.property_id=p.id
       LEFT JOIN enquiries e       ON e.property_id=p.id
       LEFT JOIN property_images pi ON pi.property_id=p.id
       WHERE p.landlord_id=$1
       GROUP BY p.id,l.id,l.status,l.listed_at
       ORDER BY p.created_at DESC`,
      [req.user.refId]
    );
    res.json(result.rows);
  } catch(err){res.status(500).json({error:err.message});}
});

// LANDLORD: list a property
router.post('/landlord/list/:propertyId', authenticate, requireRole('landlord'), async (req,res) => {
  const {propertyType,bhk,totalRooms,floorDetails,amenities,availableFrom,maxAdults,description,houseRules,securityDeposit}=req.body;
  try {
    const prop=await db.query('SELECT * FROM properties WHERE id=$1 AND landlord_id=$2',[req.params.propertyId,req.user.refId]);
    if (!prop.rows.length) return res.status(403).json({error:'Property not found'});
    await db.query(
      `UPDATE properties SET listed=TRUE,property_type=COALESCE($1,property_type),bhk=COALESCE($2,bhk),
         total_rooms=COALESCE($3,total_rooms),floor_details=COALESCE($4,floor_details),
         amenities=COALESCE($5,amenities),available_from=COALESCE($6,available_from),
         max_adults=COALESCE($7,max_adults),description=COALESCE($8,description),
         house_rules=COALESCE($9,house_rules),security_deposit=COALESCE($10,security_deposit)
       WHERE id=$11`,
      [propertyType||null,bhk||null,totalRooms?parseInt(totalRooms):null,floorDetails||null,
       amenities||null,availableFrom||null,maxAdults?parseInt(maxAdults):null,
       description||null,houseRules||null,securityDeposit?parseInt(securityDeposit):null,
       req.params.propertyId]
    );
    await db.query(
      `INSERT INTO listings (property_id,landlord_id,status) VALUES ($1,$2,'active')
       ON CONFLICT (property_id) DO UPDATE SET status='active',listed_at=NOW(),unlisted_at=NULL`,
      [req.params.propertyId,req.user.refId]
    );
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// LANDLORD: unlist
router.post('/landlord/unlist/:propertyId', authenticate, requireRole('landlord'), async (req,res) => {
  try {
    await db.query('UPDATE properties SET listed=FALSE WHERE id=$1 AND landlord_id=$2',[req.params.propertyId,req.user.refId]);
    await db.query("UPDATE listings SET status='unlisted',unlisted_at=NOW() WHERE property_id=$1",[req.params.propertyId]);
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// LANDLORD: update listing details
router.put('/landlord/listing/:propertyId', authenticate, requireRole('landlord'), async (req,res) => {
  const {propertyType,bhk,totalRooms,floorDetails,amenities,availableFrom,maxAdults,description,houseRules,securityDeposit}=req.body;
  try {
    await db.query(
      `UPDATE properties SET property_type=COALESCE($1,property_type),bhk=COALESCE($2,bhk),
         total_rooms=COALESCE($3,total_rooms),floor_details=COALESCE($4,floor_details),
         amenities=COALESCE($5,amenities),available_from=COALESCE($6,available_from),
         max_adults=COALESCE($7,max_adults),description=COALESCE($8,description),
         house_rules=COALESCE($9,house_rules),security_deposit=COALESCE($10,security_deposit)
       WHERE id=$11 AND landlord_id=$12`,
      [propertyType||null,bhk||null,totalRooms?parseInt(totalRooms):null,floorDetails||null,
       amenities||null,availableFrom||null,maxAdults?parseInt(maxAdults):null,
       description||null,houseRules||null,securityDeposit?parseInt(securityDeposit):null,
       req.params.propertyId,req.user.refId]
    );
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// ADMIN: all enquiries
router.get('/admin/enquiries', authenticate, requireRole('admin'), async (req,res) => {
  try {
    const result=await db.query(
      `SELECT e.*,p.name AS property_name,p.city,p.rent AS property_rent,
              p.address AS property_address,ll.name AS landlord_name
       FROM enquiries e
       JOIN properties p ON e.property_id=p.id
       JOIN landlords ll  ON e.landlord_id=ll.id
       ORDER BY e.created_at DESC`
    );
    res.json(result.rows);
  } catch(err){res.status(500).json({error:err.message});}
});

// ADMIN: all listings
router.get('/admin/listings', authenticate, requireRole('admin'), async (req,res) => {
  try {
    const result=await db.query(
      `SELECT p.id,p.name,p.city,p.rent,p.property_type,p.listed,p.bhk,p.total_rooms,
              l.status AS listing_status,l.listed_at,ll.name AS landlord_name,
              COUNT(DISTINCT pv.id) AS view_count,COUNT(DISTINCT e.id) AS enquiry_count
       FROM listings l
       JOIN properties p ON l.property_id=p.id
       JOIN landlords ll  ON p.landlord_id=ll.id
       LEFT JOIN property_views pv ON pv.property_id=p.id
       LEFT JOIN enquiries e       ON e.property_id=p.id
       GROUP BY p.id,l.id,l.status,l.listed_at,ll.name
       ORDER BY l.listed_at DESC`
    );
    res.json(result.rows);
  } catch(err){res.status(500).json({error:err.message});}
});

// ADMIN: update enquiry status
router.put('/admin/enquiries/:id/status', authenticate, requireRole('admin'), async (req,res) => {
  const {status,paymentRef,paymentAmount,paymentNote}=req.body;
  try {
    await db.query(
      `UPDATE enquiries SET status=$1,payment_ref=COALESCE($2,payment_ref),
         payment_amount=COALESCE($3,payment_amount),payment_note=COALESCE($4,payment_note),updated_at=NOW()
       WHERE id=$5`,
      [status,paymentRef||null,paymentAmount||null,paymentNote||null,req.params.id]
    );
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// ADMIN: onboard tenant
router.post('/admin/enquiries/:id/onboard', authenticate, requireRole('admin'), async (req,res) => {
  try {
    const enq=await db.query(
      `SELECT e.*,p.landlord_id,p.rent AS prop_rent FROM enquiries e
       JOIN properties p ON e.property_id=p.id WHERE e.id=$1`,
      [req.params.id]
    );
    if (!enq.rows.length) return res.status(404).json({error:'Enquiry not found'});
    const e=enq.rows[0];
    if (e.status!=='payment_received') return res.status(400).json({error:'Confirm payment first before onboarding'});

    const exists=await db.query('SELECT id FROM users WHERE email=$1',[e.email]);
    if (exists.rows.length) return res.status(409).json({error:'Email already registered'});

    const year=new Date().getFullYear();
    const counter=await db.query("UPDATE id_counters SET value=value+1 WHERE name='tenant' RETURNING value");
    const tenantId=`TN-${year}-${String(counter.rows[0].value).padStart(3,'0')}`;
    const hashed=await bcrypt.hash(tenantId,10);

    const user=await db.query(
      "INSERT INTO users (email,password,role,ref_id,must_change_pwd) VALUES ($1,$2,'tenant',$3,TRUE) RETURNING id",
      [e.email,hashed,tenantId]
    );
    await db.query(
      `INSERT INTO tenants (id,user_id,landlord_id,property_id,name,email,phone,rent,pay_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'paid')`,
      [tenantId,user.rows[0].id,e.landlord_id,e.property_id,e.name,e.email,e.phone,e.payment_amount||e.prop_rent]
    );
    await db.query("UPDATE properties SET status='occupied',listed=FALSE WHERE id=$1",[e.property_id]);
    await db.query("UPDATE listings SET status='rented',unlisted_at=NOW() WHERE property_id=$1",[e.property_id]);
    await db.query("UPDATE enquiries SET status='onboarded',tenant_id=$1,onboarded_at=NOW() WHERE id=$2",[tenantId,req.params.id]);

    await db.query(
      `INSERT INTO notifications (user_id,type,title,message,ref_id) VALUES ($1,'onboarded','Welcome to RentPro!',$2,$3)`,
      [user.rows[0].id,`Your tenancy is confirmed. Tenant ID: ${tenantId}. Temp password: ${tenantId} — change it on first login.`,tenantId]
    );
    await db.query(
      `INSERT INTO notifications (user_id,type,title,message,ref_id)
       SELECT u.id,'tenant_onboarded','New tenant onboarded',$2,$3
       FROM users u WHERE u.ref_id=$1 AND u.role='landlord'`,
      [e.landlord_id,`${e.name} has been onboarded as tenant (${tenantId}).`,tenantId]
    );
    res.json({success:true,tenantId,tempPassword:tenantId});
  } catch(err){res.status(500).json({error:err.message});}
});

// ADMIN: edit listing
router.put('/admin/listings/:propertyId', authenticate, requireRole('admin'), async (req,res) => {
  const {rent,propertyType,floorDetails,amenities,availableFrom,listed,description,houseRules,securityDeposit}=req.body;
  try {
    await db.query(
      `UPDATE properties SET
         rent=COALESCE($1,rent),property_type=COALESCE($2,property_type),
         floor_details=COALESCE($3,floor_details),amenities=COALESCE($4,amenities),
         available_from=COALESCE($5,available_from),listed=COALESCE($6,listed),
         description=COALESCE($7,description),house_rules=COALESCE($8,house_rules),
         security_deposit=COALESCE($9,security_deposit)
       WHERE id=$10`,
      [rent||null,propertyType||null,floorDetails||null,amenities||null,
       availableFrom||null,listed??null,description||null,houseRules||null,
       securityDeposit||null,req.params.propertyId]
    );
    if (listed===false)
      await db.query("UPDATE listings SET status='unlisted',unlisted_at=NOW() WHERE property_id=$1",[req.params.propertyId]);
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

module.exports = router;
