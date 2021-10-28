import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from "@angular/core";
//import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { BaseChartDirective, Label } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';

import { ChartDataSets } from "chart.js";
//import { CloudStatus, SeriesDatapoints } from "../cloud-status";
import { CloudRetrievalService } from "../cloud-retrieval.service";
import { jqxGridComponent } from "jqwidgets-ng/jqxgrid";

import { SplitComponent, SplitAreaDirective } from 'angular-split'



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
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;
  

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
    // We use these empty structures as placeholders for dynamic theming.
    scales: { xAxes: [{}], yAxes: [{ticks: {
      stepSize : 10,
      suggestedMax : 100,
      suggestedMin: 0
    }}] },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };
  public subtitle1 = "Failed AKS Daemonset Deployments"
  public subtitle2 = "Successful AKS Daemonset Deployments"
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartLabels: Label[] = ['AKS Cluster Status'];
  public barChartData: ChartDataSets[] = [];
  constructor(private cloudRetrievalService: CloudRetrievalService) {}
  ngOnInit() {
    this.getNonDefendedStatus();
    this.getDefendedStatus();
  }
  getNonDefendedStatus(): void {
    
    this.cloudRetrievalService
      .getAKSCloudStatus()
      .subscribe((statusResult: any) => {
        this.source.localdata = statusResult;
        
        console.log(statusResult);
        this.barChartData[0].data = [statusResult.length]
        this.barChartData[0].label =  'Unsuccessful Deployements';
        this.barChartData[0].backgroundColor = "red"
        this.chart.chart.update();
        this.myGrid.updatebounddata();
      });
      
  }

  getDefendedStatus(): void {
    this.cloudRetrievalService
      .getAKSDefendedStatus()
      .subscribe((statusResult2: any) => {
        this.source2.localdata = statusResult2;
        this.barChartData[1] = {};
        this.barChartData[1].data = [statusResult2.length]
        this.barChartData[1].label =  'Successful Deployements';
        this.barChartData[1].backgroundColor = "green"
        //this.barChartData.push({data: [statusResult2], label: 'Successful Deployements'});
        console.log(statusResult2.length);
        this.chart.chart.update();
        this.myGrid2.updatebounddata();
      });
  }

  
  ngAfterViewInit(): void {
    this.basicOptions = '&#123';
    this.myGrid.showloadelement();
    this.myGrid2.showloadelement();   
  }
}