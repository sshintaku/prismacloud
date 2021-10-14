import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CloudRetrievalService } from '../cloud-retrieval.service';
import { CloudStatus, TestData } from '../cloud-status';
import { jqxGridComponent } from 'jqwidgets-ng/jqxgrid';




@Component({
  selector: 'app-grid-jq',
  templateUrl: './grid-jq.component.html',
  styleUrls: ['./grid-jq.component.css']
})
export class GridJqComponent implements AfterViewInit, OnInit {
	@ViewChild('grid')!
	myGrid!: jqxGridComponent;

 cStatus: CloudStatus[] = []

 source =
    {
        datatype: "json",
        datafields: [
            { name: 'status', type: 'string' }
            
        ],

    };
     
    dataAdapter = new jqx.dataAdapter(this.source);

	columns = [
		{text: 'Cloud Region', datafield: 'region'},
		{text: 'Status', datafield: 'status'},
  
  ];
 
 settings: jqwidgets.GridOptions = {
	width: 850,
	source: this.dataAdapter,
	pageable: true,
	autoheight: true,
	sortable: true,
	altrows: true,
	enabletooltips: true,
	editable: true,
	selectionmode: 'multiplecellsadvanced',

};

  

  constructor(private cloudRetrievalService: CloudRetrievalService) { }

  ngOnInit() {
	
    this.getCloudStatus();
	this.myGrid.createComponent(this.settings);
	
  }

  getCloudStatus(): void {
    this.cloudRetrievalService.getAKSCloudStatus()
    .subscribe(statusResult => this.cStatus = statusResult);
  }

  
  ngAfterViewInit(): void {

  }

}
