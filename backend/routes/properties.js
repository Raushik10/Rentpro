const router = require('express').Router();
const path   = require('path');
const fs     = require('fs');
const db     = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

let upload;
try {
  const multer  = require('multer');
  const imgDir  = path.join(__dirname,'../uploads/properties');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir,{recursive:true});
  const storage = multer.diskStorage({
    destination:(req,file,cb)=>cb(null,imgDir),
    filename:(req,file,cb)=>{
      const ext=path.extname(file.originalname).toLowerCase();
      cb(null,`prop_${req.params.id}_${Date.now()}${ext}`);
    }
  });
  upload = multer({storage,limits:{fileSize:10*1024*1024},fileFilter:(req,file,cb)=>{
    const ok=['.jpg','.jpeg','.png','.webp'].includes(path.extname(file.originalname).toLowerCase());
    cb(null,ok);
  }});
} catch(e){console.warn('multer not available');}

// GET /api/properties
router.get('/', authenticate, async (req,res) => {
  try {
    let result;
    if (req.user.role==='admin') {
      result = await db.query(
        `SELECT p.*,l.name AS landlord_name FROM properties p
         LEFT JOIN landlords l ON p.landlord_id=l.id ORDER BY p.created_at DESC`
      );
    } else {
      result = await db.query(
        `SELECT p.*,t.name AS tenant_name,t.id AS tenant_id FROM properties p
         LEFT JOIN tenants t ON t.property_id=p.id AND t.status='active'
         WHERE p.landlord_id=$1 ORDER BY p.created_at DESC`,
        [req.user.refId]
      );
    }
    const props = result.rows;
    if (props.length) {
      const ids = props.map(p=>p.id);
      const imgs = await db.query(
        `SELECT * FROM property_images WHERE property_id=ANY($1) ORDER BY created_at ASC`,[ids]
      );
      const imgMap={};
      imgs.rows.forEach(img=>{
        if (!imgMap[img.property_id]) imgMap[img.property_id]=[];
        imgMap[img.property_id].push(img);
      });
      props.forEach(p=>{p.images=imgMap[p.id]||[];});
    }
    res.json(props);
  } catch(err){res.status(500).json({error:err.message});}
});

// POST /api/properties
router.post('/', authenticate, requireRole('landlord','admin'), async (req,res) => {
  const {
    name,address,city,rent,propertyType,bhk,totalRooms,floorDetails,totalFloors,
    furnishing,areaSqft,facing,parking
  } = req.body;
  if (!name||!rent) return res.status(400).json({error:'Name and rent required'});
  try {
    const counter = await db.query(
      "UPDATE id_counters SET value=value+1 WHERE name='property' RETURNING value"
    );
    const propId = 'PR'+String(counter.rows[0].value).padStart(3,'0');
    await db.query(
      `INSERT INTO properties (id,landlord_id,name,address,city,rent,property_type,bhk,total_rooms,
         floor_details,total_floors,furnishing,area_sqft,facing,parking)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [propId,req.user.refId,name,address||'',city||'',parseInt(rent),
       propertyType||null,bhk||null,totalRooms?parseInt(totalRooms):null,
       floorDetails||null,totalFloors?parseInt(totalFloors):null,
       furnishing||null,areaSqft?parseInt(areaSqft):null,facing||null,parking||null]
    );
    const prop = await db.query('SELECT * FROM properties WHERE id=$1',[propId]);
    res.status(201).json({...prop.rows[0],images:[]});
  } catch(err){res.status(500).json({error:err.message});}
});

// PUT /api/properties/:id
router.put('/:id', authenticate, requireRole('landlord','admin'), async (req,res) => {
  const {
    name,address,city,rent,status,propertyType,bhk,totalRooms,floorDetails,
    totalFloors,furnishing,areaSqft,facing,parking
  } = req.body;
  try {
    await db.query(
      `UPDATE properties SET
         name=COALESCE($1,name), address=COALESCE($2,address), city=COALESCE($3,city),
         rent=COALESCE($4,rent), status=COALESCE($5,status),
         property_type=COALESCE($6,property_type), bhk=COALESCE($7,bhk),
         total_rooms=COALESCE($8,total_rooms), floor_details=COALESCE($9,floor_details),
         total_floors=COALESCE($10,total_floors), furnishing=COALESCE($11,furnishing),
         area_sqft=COALESCE($12,area_sqft), facing=COALESCE($13,facing),
         parking=COALESCE($14,parking)
       WHERE id=$15`,
      [name,address,city,rent?parseInt(rent):null,status,
       propertyType||null,bhk||null,totalRooms?parseInt(totalRooms):null,
       floorDetails||null,totalFloors?parseInt(totalFloors):null,
       furnishing||null,areaSqft?parseInt(areaSqft):null,facing||null,parking||null,
       req.params.id]
    );
    const prop = await db.query('SELECT * FROM properties WHERE id=$1',[req.params.id]);
    res.json(prop.rows[0]);
  } catch(err){res.status(500).json({error:err.message});}
});

// DELETE /api/properties/:id
router.delete('/:id', authenticate, requireRole('landlord','admin'), async (req,res) => {
  try {
    await db.query('DELETE FROM properties WHERE id=$1',[req.params.id]);
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

// POST /api/properties/:id/images
router.post('/:id/images', authenticate, requireRole('landlord','admin'), (req,res) => {
  if (!upload) return res.status(501).json({error:'Upload not configured'});
  upload.array('images',10)(req,res,async (err) => {
    if (err) return res.status(400).json({error:err.message});
    if (!req.files||!req.files.length) return res.status(400).json({error:'No files'});
    try {
      const inserted=[];
      for (const file of req.files) {
        const url=`/uploads/properties/${file.filename}`;
        const r=await db.query(
          'INSERT INTO property_images (property_id,filename,url) VALUES ($1,$2,$3) RETURNING *',
          [req.params.id,file.filename,url]
        );
        inserted.push(r.rows[0]);
      }
      res.json({success:true,images:inserted});
    } catch(e){res.status(500).json({error:e.message});}
  });
});

// DELETE /api/properties/:id/images/:imgId
router.delete('/:id/images/:imgId', authenticate, requireRole('landlord','admin'), async (req,res) => {
  try {
    const img = await db.query('SELECT * FROM property_images WHERE id=$1',[req.params.imgId]);
    if (img.rows.length) {
      const fp=path.join(__dirname,'../uploads/properties',img.rows[0].filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
      await db.query('DELETE FROM property_images WHERE id=$1',[req.params.imgId]);
    }
    res.json({success:true});
  } catch(err){res.status(500).json({error:err.message});}
});

module.exports = router;
