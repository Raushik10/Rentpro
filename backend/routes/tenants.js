const router = require('express').Router();
const bcrypt = require('bcryptjs');
const path   = require('path');
const fs     = require('fs');
const db     = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// multer for contract uploads
let upload;
try {
  const multer = require('multer');
  const dir    = path.join(__dirname,'../uploads/contracts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  const storage = multer.diskStorage({
    destination:(req,file,cb)=>cb(null,dir),
    filename:(req,file,cb)=>{
      const ext=path.extname(file.originalname).toLowerCase();
      cb(null,`contract_${req.params.id}_${Date.now()}${ext}`);
    }
  });
  upload = multer({storage,limits:{fileSize:10*1024*1024},fileFilter:(req,file,cb)=>{
    const ok=['.pdf','.jpg','.jpeg','.png'].includes(path.extname(file.originalname).toLowerCase());
    cb(null,ok);
  }});
} catch(e){console.warn('multer not available');}

// GET /api/tenants
router.get('/', authenticate, async (req,res) => {
  try {
    let result;
    if (req.user.role==='admin') {
      result = await db.query(
        `SELECT t.*,l.name AS landlord_name,p.name AS property_name,l.currency AS landlord_currency
         FROM tenants t
         LEFT JOIN landlords  l ON t.landlord_id=l.id
         LEFT JOIN properties p ON t.property_id=p.id
         ORDER BY t.created_at DESC`
      );
    } else if (req.user.role==='landlord') {
      result = await db.query(
        `SELECT t.*,p.name AS property_name
         FROM tenants t
         LEFT JOIN properties p ON t.property_id=p.id
         WHERE t.landlord_id=$1 ORDER BY t.created_at DESC`,
        [req.user.refId]
      );
    } else {
      result = await db.query(
        `SELECT t.*,p.name AS property_name,
                l.name AS landlord_name,l.email AS landlord_email,l.phone AS landlord_phone,
                l.currency AS landlord_currency
         FROM tenants t
         LEFT JOIN properties p ON t.property_id=p.id
         LEFT JOIN landlords  l ON t.landlord_id=l.id
         WHERE t.id=$1`,
        [req.user.refId]
      );
    }
    res.json(result.rows);
  } catch(err){res.status(500).json({error:err.message});}
});

// POST /api/tenants — issue tenant ID
router.post('/', authenticate, requireRole('landlord','admin'), async (req,res) => {
  const { name,email,phone,propertyId,rent,leaseStart,leaseEnd,landlordId } = req.body;
  if (!name||!email) return res.status(400).json({error:'Name and email required'});
  try {
    const exists = await db.query('SELECT id FROM users WHERE email=$1',[email]);
    if (exists.rows.length>0) return res.status(409).json({error:'Email already registered'});

    const llId = req.user.role==='admin' ? landlordId : req.user.refId;
    const year = new Date().getFullYear();
    const counter = await db.query("UPDATE id_counters SET value=value+1 WHERE name='tenant' RETURNING value");
    const tenantId = `TN-${year}-${String(counter.rows[0].value).padStart(3,'0')}`;
    const hashed   = await bcrypt.hash(tenantId,10);

    const user = await db.query(
      "INSERT INTO users (email,password,role,ref_id,must_change_pwd) VALUES ($1,$2,'tenant',$3,TRUE) RETURNING id",
      [email,hashed,tenantId]
    );
    await db.query(
      `INSERT INTO tenants (id,user_id,landlord_id,property_id,name,email,phone,rent,lease_start,lease_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [tenantId,user.rows[0].id,llId,propertyId||null,name,email,phone||'',rent||0,leaseStart||null,leaseEnd||null]
    );
    if (propertyId) await db.query("UPDATE properties SET status='occupied' WHERE id=$1",[propertyId]);

    res.status(201).json({tenantId,tempPassword:tenantId});
  } catch(err){res.status(500).json({error:err.message});}
});

// PUT /api/tenants/:id — update tenant (incl. property assignment)
router.put('/:id', authenticate, requireRole('landlord','admin'), async (req,res) => {
  const { name,email,phone,rent,leaseStart,leaseEnd,payStatus,status,landlordId,propertyId } = req.body;
  try {
    // Handle property reassignment
    if ('propertyId' in req.body) {
      // Get old property
      const old = await db.query('SELECT property_id FROM tenants WHERE id=$1',[req.params.id]);
      const oldPropId = old.rows[0]?.property_id;
      // Free old property if different
      if (oldPropId && oldPropId!==propertyId)
        await db.query("UPDATE properties SET status='vacant' WHERE id=$1",[oldPropId]);
      // Occupy new property
      if (propertyId)
        await db.query("UPDATE properties SET status='occupied' WHERE id=$1",[propertyId]);
    }

    await db.query(
      `UPDATE tenants SET
         name=COALESCE($1,name), email=COALESCE($2,email), phone=COALESCE($3,phone),
         rent=COALESCE($4,rent), lease_start=COALESCE($5,lease_start),
         lease_end=COALESCE($6,lease_end), pay_status=COALESCE($7,pay_status),
         status=COALESCE($8,status), landlord_id=COALESCE($9,landlord_id),
         property_id=COALESCE($10,property_id)
       WHERE id=$11`,
      [name,email,phone,rent?parseInt(rent):null,leaseStart||null,leaseEnd||null,
       payStatus,status,landlordId||null,
       'propertyId' in req.body ? (propertyId||null) : undefined,
       req.params.id]
    );
    const t = await db.query('SELECT * FROM tenants WHERE id=$1',[req.params.id]);
    res.json(t.rows[0]);
  } catch(err){res.status(500).json({error:err.message});}
});

// PUT /api/tenants/:id/payment — mark payment (non-cash)
router.put('/:id/payment', authenticate, async (req,res) => {
  const { status,month,method,amount,remark } = req.body;
  if (req.user.role==='tenant'&&req.user.refId!==req.params.id)
    return res.status(403).json({error:'Forbidden'});
  try {
    await db.query('UPDATE tenants SET pay_status=$1 WHERE id=$2',[status,req.params.id]);
    if (status==='paid') {
      const t = await db.query('SELECT * FROM tenants WHERE id=$1',[req.params.id]);
      await db.query(
        `INSERT INTO payments (tenant_id,property_id,landlord_id,amount,month,method,status,remark)
         VALUES ($1,$2,$3,$4,$5,$6,'paid',$7)`,
        [req.params.id,t.rows[0].property_id,t.rows[0].landlord_id,
         amount||t.rows[0].rent,month||'',method||'manual',remark||null]
      );
    }
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// POST /api/tenants/:id/cash-request — tenant requests cash payment confirmation
router.post('/:id/cash-request', authenticate, requireRole('tenant'), async (req,res) => {
  if (req.user.refId!==req.params.id) return res.status(403).json({error:'Forbidden'});
  const { amount,month } = req.body;
  try {
    const t = await db.query('SELECT * FROM tenants WHERE id=$1',[req.params.id]);
    if (!t.rows.length) return res.status(404).json({error:'Tenant not found'});
    const tenant = t.rows[0];

    const r = await db.query(
      `INSERT INTO cash_payment_requests (tenant_id,landlord_id,property_id,amount,month)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [req.params.id,tenant.landlord_id,tenant.property_id,amount||tenant.rent,month||'']
    );

    // Notify landlord
    await db.query(
      `INSERT INTO notifications (user_id,type,title,message,ref_id)
       SELECT u.id,'cash_request','Cash payment confirmation request',$2,$3
       FROM users u WHERE u.ref_id=$1 AND u.role='landlord'`,
      [tenant.landlord_id,`${tenant.name} has submitted a cash payment of ₹${amount||tenant.rent} for ${month}. Please confirm or reject.`,String(r.rows[0].id)]
    );
    res.json({success:true,requestId:r.rows[0].id});
  } catch(err){res.status(500).json({error:err.message});}
});

// GET /api/tenants/cash-requests/pending — landlord sees pending cash requests
router.get('/cash-requests/pending', authenticate, requireRole('landlord','admin'), async (req,res) => {
  try {
    const llId = req.user.role==='admin' ? null : req.user.refId;
    const result = await db.query(
      `SELECT cr.*,t.name AS tenant_name,t.email AS tenant_email,p.name AS property_name
       FROM cash_payment_requests cr
       JOIN tenants    t ON cr.tenant_id=t.id
       JOIN properties p ON cr.property_id=p.id
       WHERE cr.status='pending' ${llId?'AND cr.landlord_id=$1':''}
       ORDER BY cr.created_at DESC`,
      llId?[llId]:[]
    );
    res.json(result.rows);
  } catch(err){res.status(500).json({error:err.message});}
});

// PUT /api/tenants/cash-requests/:reqId/resolve — landlord confirms or rejects cash
router.put('/cash-requests/:reqId/resolve', authenticate, requireRole('landlord','admin'), async (req,res) => {
  const { action,remark } = req.body; // action: 'confirm'|'reject'
  try {
    const cr = await db.query('SELECT * FROM cash_payment_requests WHERE id=$1',[req.params.reqId]);
    if (!cr.rows.length) return res.status(404).json({error:'Request not found'});
    const request = cr.rows[0];

    await db.query(
      'UPDATE cash_payment_requests SET status=$1,landlord_remark=$2,resolved_at=NOW() WHERE id=$3',
      [action==='confirm'?'confirmed':'rejected',remark||null,req.params.reqId]
    );

    if (action==='confirm') {
      // Mark payment
      await db.query('UPDATE tenants SET pay_status=$1 WHERE id=$2',['paid',request.tenant_id]);
      await db.query(
        `INSERT INTO payments (tenant_id,property_id,landlord_id,amount,month,method,status,remark)
         VALUES ($1,$2,$3,$4,$5,'cash','paid',$6)`,
        [request.tenant_id,request.property_id,request.landlord_id,request.amount,request.month,remark||null]
      );
      // Notify tenant
      await db.query(
        `INSERT INTO notifications (user_id,type,title,message,ref_id)
         SELECT u.id,'payment_confirmed','Cash payment confirmed',$2,$3
         FROM users u WHERE u.ref_id=$1 AND u.role='tenant'`,
        [request.tenant_id,
         `Your cash payment of ₹${request.amount} for ${request.month} has been confirmed by your landlord.${remark?` Remark: ${remark}`:''}`,
         String(request.id)]
      );
    } else {
      await db.query(
        `INSERT INTO notifications (user_id,type,title,message,ref_id)
         SELECT u.id,'payment_rejected','Cash payment not confirmed',$2,$3
         FROM users u WHERE u.ref_id=$1 AND u.role='tenant'`,
        [request.tenant_id,
         `Your cash payment request for ${request.month} was not confirmed by your landlord.${remark?` Remark: ${remark}`:''}`,
         String(request.id)]
      );
    }
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// PUT /api/tenants/:id/contract
router.put('/:id/contract', authenticate, requireRole('landlord','admin'), async (req,res) => {
  const { leaseStart,leaseEnd,rent } = req.body;
  try {
    await db.query(
      `UPDATE tenants SET lease_start=COALESCE($1,lease_start),lease_end=COALESCE($2,lease_end),rent=COALESCE($3,rent) WHERE id=$4`,
      [leaseStart||null,leaseEnd||null,rent?parseInt(rent):null,req.params.id]
    );
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// POST /api/tenants/:id/upload-contract
router.post('/:id/upload-contract', authenticate, requireRole('landlord','admin'), (req,res) => {
  if (!upload) return res.status(501).json({error:'Upload not configured'});
  upload.single('contract')(req,res,async (err) => {
    if (err) return res.status(400).json({error:err.message});
    if (!req.file) return res.status(400).json({error:'No file uploaded'});
    try {
      const docPath=`/uploads/contracts/${req.file.filename}`;
      await db.query('UPDATE tenants SET contract_doc=$1 WHERE id=$2',[docPath,req.params.id]);
      res.json({success:true,contractDoc:docPath});
    } catch(e){res.status(500).json({error:e.message});}
  });
});

// DELETE /api/tenants/:id/contract-doc
router.delete('/:id/contract-doc', authenticate, requireRole('landlord','admin'), async (req,res) => {
  try {
    const t = await db.query('SELECT contract_doc FROM tenants WHERE id=$1',[req.params.id]);
    if (t.rows[0]?.contract_doc) {
      const fp=path.join(__dirname,'..',t.rows[0].contract_doc);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
      await db.query('UPDATE tenants SET contract_doc=NULL WHERE id=$1',[req.params.id]);
    }
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// POST /api/tenants/:id/change-request
router.post('/:id/change-request', authenticate, requireRole('tenant'), async (req,res) => {
  const { fields } = req.body;
  if (req.user.refId!==req.params.id) return res.status(403).json({error:'Forbidden'});
  try {
    const t = await db.query('SELECT * FROM tenants WHERE id=$1',[req.params.id]);
    if (!t.rows.length) return res.status(404).json({error:'Not found'});
    const tenant = t.rows[0];
    for (const { field,newValue } of fields) {
      await db.query(
        `INSERT INTO change_requests (tenant_id,landlord_id,field_name,old_value,new_value)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.params.id,tenant.landlord_id,field,tenant[field]||'',newValue]
      );
    }
    await db.query(
      `INSERT INTO notifications (user_id,type,title,message,ref_id)
       SELECT u.id,'change_request','Profile update request',$2,$3
       FROM users u WHERE u.ref_id=$1 AND u.role='landlord'`,
      [tenant.landlord_id,`${tenant.name} has requested a profile update.`,req.params.id]
    );
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// GET /api/tenants/change-requests/pending
router.get('/change-requests/pending', authenticate, requireRole('landlord','admin'), async (req,res) => {
  try {
    const llId = req.user.role==='admin'?null:req.user.refId;
    const result = await db.query(
      `SELECT cr.*,t.name AS tenant_name,t.email AS tenant_email
       FROM change_requests cr JOIN tenants t ON cr.tenant_id=t.id
       WHERE cr.status='pending' ${llId?'AND cr.landlord_id=$1':''}
       ORDER BY cr.created_at DESC`,
      llId?[llId]:[]
    );
    res.json(result.rows);
  } catch(err){res.status(500).json({error:err.message});}
});

// PUT /api/tenants/change-requests/:reqId/resolve
router.put('/change-requests/:reqId/resolve', authenticate, requireRole('landlord','admin'), async (req,res) => {
  const { action } = req.body;
  try {
    const cr = await db.query('SELECT * FROM change_requests WHERE id=$1',[req.params.reqId]);
    if (!cr.rows.length) return res.status(404).json({error:'Not found'});
    const request = cr.rows[0];
    await db.query(
      'UPDATE change_requests SET status=$1,resolved_at=NOW() WHERE id=$2',
      [action==='accept'?'accepted':'rejected',req.params.reqId]
    );
    if (action==='accept') {
      await db.query(`UPDATE tenants SET ${request.field_name}=$1 WHERE id=$2`,[request.new_value,request.tenant_id]);
      await db.query(
        `INSERT INTO notifications (user_id,type,title,message,ref_id)
         SELECT u.id,'change_approved','Profile update approved','Your profile update has been approved and applied.',$$
         FROM users u WHERE u.ref_id=$1 AND u.role='tenant'`,
        [request.tenant_id]
      );
    } else {
      await db.query(
        `INSERT INTO notifications (user_id,type,title,message,ref_id)
         SELECT u.id,'change_rejected','Profile update declined','Your profile update request was declined by your landlord.',$2
         FROM users u WHERE u.ref_id=$1 AND u.role='tenant'`,
        [request.tenant_id,request.tenant_id]
      );
    }
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

module.exports = router;
