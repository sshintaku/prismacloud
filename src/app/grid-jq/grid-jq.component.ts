import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from "@angular/core";
import { CloudStatus } from "../cloud-status";
import { CloudRetrievalService } from "../cloud-retrieval.service";
import { jqxGridComponent } from "jqwidgets-ng/jqxgrid";
@Component({
  selector: "app-grid-jq",
  templateUrl: "./grid-jq.component.html",
  styleUrls: ["./grid-jq.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridJqComponent implements AfterViewInit, OnInit {
  @ViewChild("grid") myGrid!: jqxGridComponent;
  source = {
    localdata: null,
    datatype: "json",
    datafields: [
      { name: "region", type: "string" },
      { name: "Status", type: "string" },
    ],
  };
  columns = [
    { text: "Cloud Region", datafield: "region" },
    { text: "Status", datafield: "Status" }
  ];
  dataAdapter = new jqx.dataAdapter(this.source);
  constructor(private cloudRetrievalService: CloudRetrievalService) {}
  ngOnInit() {}
  getCloudStatus(): void {
    this.cloudRetrievalService
      .getAKSCloudStatus()
      .subscribe((statusResult: any) => {
        this.source.localdata = statusResult;
        this.myGrid.updatebounddata();
      });
  }
  ngAfterViewInit(): void {
    this.myGrid.showloadelement();
    this.getCloudStatus();
  }
}