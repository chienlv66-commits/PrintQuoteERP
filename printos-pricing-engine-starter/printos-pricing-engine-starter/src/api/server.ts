import express from 'express';
import quoteRoutes from './quote.routes';

const app = express();
app.use(express.json());
app.use('/api', quoteRoutes);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`PrintOS pricing API running on http://localhost:${port}`);
});
