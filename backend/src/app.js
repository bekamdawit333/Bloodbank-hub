const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const stationRoutes = require('./modules/station/station.routes');
const labRoutes = require('./modules/laboratory/lab.routes');
const warehouseRoutes = require('./modules/warehouse/warehouse.routes');
const hospitalRoutes = require('./modules/hospital/hospital.routes');
const donorRoutes = require('./modules/donor/donor.routes');
const hmsRoutes = require('./modules/hms/hms.routes');
const notifRoutes = require('./modules/notifications/notifications.routes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/station', stationRoutes);
  app.use('/api/lab', labRoutes);
  app.use('/api/warehouse', warehouseRoutes);
  app.use('/api/hospital', hospitalRoutes);
  app.use('/api/donor', donorRoutes);
  app.use('/api/hms', hmsRoutes);
  app.use('/api/notifications', notifRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'Blood Bank Hub & Emergency API Server is Online' });
  });

  app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp };
