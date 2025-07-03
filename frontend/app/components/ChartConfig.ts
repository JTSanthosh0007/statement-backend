import Chart from 'chart.js/auto';
import { ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';

// Register Chart.js components
Chart.register(
    ArcElement,
    BarElement,
    CategoryScale,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
);

export default Chart; 