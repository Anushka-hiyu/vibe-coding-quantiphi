import { Router } from 'express';
import { listTrips, getTrip, saveTrip, removeTrip, isMongo } from '../services/store.js';
import { calculateBudget } from '../services/budgetService.js';
const router = Router();
const validDateRange = (a,b) => new Date(b) >= new Date(a);

router.get('/', async (req,res,next) => { try { res.json({ success:true, data: await listTrips() }); } catch(e){next(e);} });
router.post('/', async (req,res,next) => {
  try {
    const { tripName, destination, startDate, endDate, totalBudget=0 } = req.body;
    if (!tripName?.trim() || !destination?.trim() || !startDate || !endDate) return res.status(400).json({success:false,message:'Trip name, destination and dates are required.'});
    if (!validDateRange(startDate,endDate)) return res.status(400).json({success:false,message:'End date must be on or after start date.'});
    if (Number(totalBudget)<0 || !Number.isFinite(Number(totalBudget))) return res.status(400).json({success:false,message:'Budget must be a valid non-negative number.'});
    const trip = await saveTrip({ ...req.body, totalBudget:Number(totalBudget), destinations:[], activities:[] });
    res.status(201).json({success:true,data:trip});
  } catch(e){next(e);}
});
router.get('/:id', async (req,res,next) => { try { const t=await getTrip(req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'}); res.json({success:true,data:t}); } catch(e){next(e);} });
router.put('/:id', async (req,res,next) => {
  try {
    if (req.body.startDate && req.body.endDate && !validDateRange(req.body.startDate,req.body.endDate)) return res.status(400).json({success:false,message:'End date must be on or after start date.'});
    if (req.body.totalBudget !== undefined && Number(req.body.totalBudget)<0) return res.status(400).json({success:false,message:'Budget cannot be negative.'});
    const t=await saveTrip(req.body,req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'}); res.json({success:true,data:t});
  } catch(e){next(e);}
});
router.delete('/:id', async (req,res,next) => { try { const t=await removeTrip(req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'}); res.json({success:true,message:'Trip deleted'}); } catch(e){next(e);} });

router.post('/:id/destinations', async (req,res,next) => {
  try { const t=await getTrip(req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'});
    if(!req.body.name?.trim())return res.status(400).json({success:false,message:'Destination name is required'});
    t.destinations ||= []; const destination = { ...req.body }; if (!isMongo()) destination._id = `dest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; t.destinations.push(destination);
    const saved=await saveTrip({destinations:t.destinations},req.params.id); res.status(201).json({success:true,data:saved});
  } catch(e){next(e);}
});
router.delete('/:id/destinations/:destinationId', async (req,res,next) => {
  try { const t=await getTrip(req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'});
    const nextItems=(t.destinations||[]).filter(d=>String(d._id)!==req.params.destinationId);
    const saved=await saveTrip({destinations:nextItems},req.params.id); res.json({success:true,data:saved});
  } catch(e){next(e);}
});
router.post('/:id/activities', async (req,res,next) => {
  try { const t=await getTrip(req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'});
    const a=req.body; if(!a.title?.trim() || !a.date)return res.status(400).json({success:false,message:'Activity title and date are required'});
    const day=new Date(a.date), start=new Date(t.startDate), end=new Date(t.endDate);
    if(day < new Date(start.toDateString()) || day > new Date(end.toDateString()))return res.status(400).json({success:false,message:'Activity date must fall within the trip dates.'});
    if(Number(a.estimatedCost||0)<0 || Number(a.actualCost||0)<0)return res.status(400).json({success:false,message:'Costs cannot be negative.'});
    t.activities ||= []; const activity = {...a, estimatedCost:Number(a.estimatedCost||0), actualCost:Number(a.actualCost||0)}; if (!isMongo()) activity._id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; t.activities.push(activity);
    const saved=await saveTrip({activities:t.activities},req.params.id); res.status(201).json({success:true,data:saved});
  } catch(e){next(e);}
});
router.put('/:id/activities/:activityId', async (req,res,next) => {
  try { const t=await getTrip(req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'});
    const arr=(t.activities||[]).map(a=>String(a._id)===req.params.activityId?{...a,...req.body,estimatedCost:Number(req.body.estimatedCost ?? a.estimatedCost ?? 0),actualCost:Number(req.body.actualCost ?? a.actualCost ?? 0)}:a);
    if(!arr.some(a=>String(a._id)===req.params.activityId))return res.status(404).json({success:false,message:'Activity not found'});
    if(arr.some(a=>a.estimatedCost<0||a.actualCost<0))return res.status(400).json({success:false,message:'Costs cannot be negative'});
    const saved=await saveTrip({activities:arr},req.params.id); res.json({success:true,data:saved});
  } catch(e){next(e);}
});
router.delete('/:id/activities/:activityId', async (req,res,next) => {
  try { const t=await getTrip(req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'});
    const arr=(t.activities||[]).filter(a=>String(a._id)!==req.params.activityId);
    const saved=await saveTrip({activities:arr},req.params.id); res.json({success:true,data:saved});
  } catch(e){next(e);}
});
router.get('/:id/budget', async (req,res,next) => { try { const t=await getTrip(req.params.id); if(!t)return res.status(404).json({success:false,message:'Trip not found'}); res.json({success:true,data:calculateBudget(t)}); } catch(e){next(e);} });
export default router;
