import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import tripRoutes from './routes/trips.js';
import aiRoutes from './routes/ai.js';
import documentRoutes from './routes/documents.js';
import placeRoutes from './routes/places.js';
import { notFound,errorHandler } from './middleware/errors.js';

const app=express();
app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173'}));
app.use(express.json({limit:'1mb'}));
const __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads',express.static(path.resolve(__dirname,'../',process.env.UPLOAD_DIR||'uploads')));
app.get('/api/health',(req,res)=>res.json({success:true,database:globalThis.mongoConnected?'mongodb':'demo-memory'}));
app.use('/api/trips',tripRoutes);
app.use('/api/ai',aiRoutes);
app.use('/api/places',placeRoutes);
app.use('/api/trips',documentRoutes);
app.use(notFound);
app.use(errorHandler);

const port=process.env.PORT||5000;
if(process.env.MONGODB_URI){
 try{await mongoose.connect(process.env.MONGODB_URI);globalThis.mongoConnected=true;console.log('MongoDB connected');}
 catch(err){console.error('MongoDB connection failed; starting demo-memory mode:',err.message);globalThis.mongoConnected=false;}
}else{globalThis.mongoConnected=false;console.warn('MONGODB_URI missing: demo-memory mode (data resets on restart)');}
app.listen(port,()=>console.log(`Waypoint API running on http://localhost:${port}`));
