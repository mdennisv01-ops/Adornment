const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { ContactMessage } = require('../../models');
const { authenticate, requireStaff } = require('../../middleware/auth');

const messageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  message: z.string().trim().min(5).max(3000),
});

router.post('/', validate({ body: messageSchema }), asyncHandler(async (req, res) => {
  const saved = await ContactMessage.create(req.body);
  res.status(201).json({ success: true, data: { id: saved._id, message: 'Your message was received.' } });
}));

router.get('/', authenticate(), requireStaff('OWNER','ADMIN','SELLER'), asyncHandler(async (req,res)=>{
  const page=Math.max(1,Number(req.query.page)||1),pageSize=Math.min(100,Math.max(1,Number(req.query.pageSize)||25));
  const [items,total]=await Promise.all([ContactMessage.find().sort({createdAt:-1}).skip((page-1)*pageSize).limit(pageSize),ContactMessage.countDocuments()]);
  res.json({success:true,data:{items,total,page,pageSize}});
}));

router.patch('/:id/status', authenticate(), requireStaff('OWNER','ADMIN','SELLER'), asyncHandler(async(req,res)=>{
  const parsed=z.object({status:z.enum(['NEW','READ','CLOSED'])}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({success:false,message:'Status must be NEW, READ, or CLOSED'});
  const item=await ContactMessage.findByIdAndUpdate(req.params.id,{status:parsed.data.status},{new:true});
  if(!item)return res.status(404).json({success:false,message:'Message not found'});
  res.json({success:true,data:item});
}));

module.exports = router;
