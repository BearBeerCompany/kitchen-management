import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {Chart} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

// Registra il plugin datalabels globalmente
Chart.register(ChartDataLabels);

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
