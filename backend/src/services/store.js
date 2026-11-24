import Trip from '../models/Trip.js';
import Document from '../models/Document.js';

export const memory = { trips: [], documents: [] };
export const isMongo = () => Boolean(globalThis.mongoConnected);

export async function listTrips() { return isMongo() ? Trip.find().sort({ createdAt: -1 }) : memory.trips; }
export async function getTrip(id) {
  if (isMongo()) return Trip.findById(id);
  return memory.trips.find(t => String(t._id) === String(id)) || null;
}
export async function saveTrip(data, id) {
  if (isMongo()) {
    if (id) return Trip.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return Trip.create(data);
  }
  if (id) {
    const i = memory.trips.findIndex(t => String(t._id) === String(id));
    if (i < 0) return null;
    memory.trips[i] = { ...memory.trips[i], ...data, updatedAt: new Date().toISOString() };
    return memory.trips[i];
  }
  const trip = { ...data, _id: `demo-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, destinations: [], activities: [], createdAt: new Date().toISOString() };
  memory.trips.unshift(trip); return trip;
}
export async function removeTrip(id) {
  if (isMongo()) return Trip.findByIdAndDelete(id);
  const i = memory.trips.findIndex(t => String(t._id) === String(id));
  return i < 0 ? null : memory.trips.splice(i, 1)[0];
}
export async function saveDoc(data) {
  if (isMongo()) return Document.create(data);
  const doc = { ...data, _id: `doc-${Date.now()}`, createdAt: new Date().toISOString() };
  memory.documents.push(doc); return doc;
}
export async function listDocs(tripId) {
  if (isMongo()) return Document.find({ tripId }).sort({ createdAt: -1 });
  return memory.documents.filter(d => String(d.tripId) === String(tripId));
}
export async function removeDoc(id) {
  if (isMongo()) return Document.findByIdAndDelete(id);
  const i = memory.documents.findIndex(d => String(d._id) === String(id));
  return i < 0 ? null : memory.documents.splice(i,1)[0];
}
