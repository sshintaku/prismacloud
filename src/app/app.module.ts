import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GridJqComponent } from './grid-jq/grid-jq.component';
import { jqxGridModule} from 'jqwidgets-ng/jqxgrid';
import { HttpClientModule } from '@angular/common/http';
import { MessagesComponent } from './messages/messages.component'
import { ChartsModule } from 'ng2-charts';
import { AngularSplitModule } from 'angular-split';
import { jqxTabsModule } from 'jqwidgets-ng/jqxtabs';
import { jqxCheckBoxModule } from 'jqwidgets-ng/jqxcheckbox';
//{ MyBarChartComponent } from './my-bar-chart/my-bar-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    GridJqComponent,
    MessagesComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    jqxGridModule,
    HttpClientModule,
    ChartsModule,
    AngularSplitModule,
    jqxTabsModule,
    jqxCheckBoxModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class AppModule { }
