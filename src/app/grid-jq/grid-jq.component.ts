import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from "@angular/core";

import{ jqxChartComponent } from 'jqwidgets-ng/jqxchart';
//import { CloudStatus, SeriesDatapoints } from "../cloud-status";
import { CloudRetrievalService } from "../cloud-retrieval.service";
import { jqxGridComponent } from "jqwidgets-ng/jqxgrid";
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
//import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { Label } from 'ng2-charts';

@Component({
  selector: "app-grid-jq",
  templateUrl: "./grid-jq.component.html",
  styles: [

  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridJqComponent implements AfterViewInit, OnInit {
  @ViewChild("grid") myGrid!: jqxGridComponent;
  @ViewChild("grid2") myGrid2!: jqxGridComponent;
  @ViewChild("barChart") myBar!: ChartDataSets;
description = "Column chart displaying undefended AKS clusters vs. defended clusters"
title = "Defended vs Undefended AKS Clusters"
  source = {
    localdata: null,
    datatype: "json",
    datafields: [
      { name: "region", type: "string" },
      { name: "Status", type: "string" },
    ],
  };

  source2 = {
    localdata: null,
    datatype: "json",
    datafields: [
      { name: "region", type: "string" },
      { name: "Status", type: "string" },
    ],
  };

  columns = [
    { text: "Cloud Region", datafield: "region", width: 120 },
    { text: "Status", datafield: "Status" }
  ];

  basicData: any
  basicOptions: any

  yAxis: any

  dataAdapter = new jqx.dataAdapter(this.source);
  dataAdapter2 = new jqx.dataAdapter(this.source2)


  // Bar Graph variable instantiation

  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartLabels: Label[] = ['AKS Cluster Status'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartData: ChartDataSets[] = [
   
  ];
  constructor(private cloudRetrievalService: CloudRetrievalService) {}
  ngOnInit() {
    
  }
  getNonDefendedStatus(): void {
    
    this.cloudRetrievalService
      .getAKSCloudStatus()
      .subscribe((statusResult: any) => {
        this.source.localdata = statusResult;
        
        console.log(statusResult);
        this.barChartData.push({data: [statusResult.length], label: 'Failed Deployments'});
        this.myGrid.updatebounddata();
        this.myBar.data?.push(statusResult.length)
        this.myBar.label = "Failed Deployments"
      });
      
  }

  getDefendedStatus(): void {
    this.cloudRetrievalService
      .getAKSDefendedStatus()
      .subscribe((statusResult2: any) => {
        this.source2.localdata = statusResult2;
        this.barChartData.push({data: [statusResult2.length], label: 'Successful Deployements'});
        console.log(statusResult2.length);
        this.myGrid2.updatebounddata();
        this.myBar.data?.push(statusResult2.length)
        this.myBar.label = "Successful Deployments"
      });
  }

  
  ngAfterViewInit(): void {
    this.basicOptions = '&#123';
    this.barChartData = [];
    this.myGrid.showloadelement();
    this.myGrid2.showloadelement();
    this.getNonDefendedStatus();
    this.getDefendedStatus();
   
  }
}