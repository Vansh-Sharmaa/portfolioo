import './style.css';

import Application from './Application/Application';

const app: Application = new Application();
(window as any).app = app;
(window as any).application = app;
