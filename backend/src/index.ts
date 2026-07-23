import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
    console.log(`🚀 Attendance System API running on port ${env.PORT}`);
});