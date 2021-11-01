import{Component, ViewChild, ElementRef, NgModule } from '@angular/core';
import{ jqxTabsComponent } from 'jqwidgets-ng/jqxtabs';        

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  
})

export class AppComponent {
  @ViewChild('tabsReference', { static: false }) myTabs!: jqxTabsComponent;
  title = 'Prisma Cloud Reporting';
  height = 1000

  onChangeAnimation(event: any): void {
    let checked = event.args.checked;
    this.myTabs.selectionTracker(checked);
}
onChangeContentAnimation(event: any): void {
    let checked = event.args.checked;
    if (checked) {
        this.myTabs.animationType('fade');
    }
    else {
        this.myTabs.animationType('none');
    }
}
}
