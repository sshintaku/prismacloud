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
  constructor(private cloudRetrievalService: CloudRetrievalService) {}
  ngOnInit() {
    
  }
  getNonDefendedStatus(): void {
    
    this.cloudRetrievalService
      .getAKSCloudStatus()
      .subscribe((statusResult: any) => {
        this.source.localdata = statusResult;
        console.log(statusResult)
        this.yAxis.push(statusResult.length)
        this.myGrid.updatebounddata();
      });
      
  }

  getDefendedStatus(): void {
    this.cloudRetrievalService
      .getAKSDefendedStatus()
      .subscribe((statusResult2: any) => {
        this.source2.localdata = statusResult2;
        console.log(statusResult2.length);
        this.yAxis.push(statusResult2.length)
        this.myGrid2.updatebounddata();
      });
  }

  
  ngAfterViewInit(): void {
    this.basicOptions = '&#123';
    this.yAxis = []
    this.myGrid.showloadelement();
    this.myGrid2.showloadelement();
    this.getNonDefendedStatus();
    this.getDefendedStatus();
   
  }
}