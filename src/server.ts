import { app } from './app';

const PORT = Number(process.env.PORT) || 8001;
app.listen(PORT, '0.0.0.0', () => console.log(`Web chat server listening on port ${PORT}`));

export default app;