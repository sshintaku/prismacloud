import { __decorate } from "tslib";
import { Component, Input, ChangeDetectionStrategy, ContentChildren, Output, EventEmitter, ViewChildren, ViewChild, Optional, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LEFT_ARROW, RIGHT_ARROW } from '@angular/cdk/keycodes';
import { InputBoolean, InputNumber } from '../util/convert';
import { NglCarouselImage } from './carousel-image';
import { NglCarouselIndicator } from './carousel-indicator';
export class NglCarousel {
    constructor(document) {
        this.document = document;
        this.activeChange = new EventEmitter();
        /**
         * The auto scroll duration in seconds. After that the next image is displayed.
         */
        this.scrollDuration = 5;
        /**
         * Whether auto scroll is enabled.
         */
        this.autoScroll = true;
        /**
         * Whether the carousel should continue looping from the beginning after the last item is displayed.
         */
        this.autoRefresh = true;
        this.labels = {
            startAutoPlay: 'Start auto-play',
            stopAutoPlay: 'Stop auto-play',
        };
        this.playing = true;
        this.nextTimer = null;
    }
    isActive(index) {
        return index === this.active;
    }
    getImage(index) {
        return this.images.toArray()[index];
    }
    ngOnChanges(changes) {
        if (changes.active) {
            // Focus correct indicator if one is already focused
            if (this.document && this.indicatorsEl.nativeElement.contains(document.activeElement)) {
                this.indicators.toArray()[this.active].focus();
            }
        }
        if (changes.active || changes.autoScroll || changes.scrollDuration) {
            // Reset timer when active changes
            this.setTimer();
        }
    }
    onIndicatorClick(index) {
        this.setActive(index, true);
    }
    onKeyboard(evt) {
        if (evt.keyCode === LEFT_ARROW || evt.keyCode === RIGHT_ARROW) {
            this.activateNext(evt.keyCode === LEFT_ARROW);
        }
    }
    setActive(index, stopPlaying = false) {
        if (stopPlaying) {
            this.playing = false;
        }
        if (this.active !== index) {
            this.activeChange.emit(index);
        }
    }
    togglePlay() {
        this.playing = !this.playing;
        this.setTimer();
    }
    playLabel() {
        return this.labels[this.playing ? 'stopAutoPlay' : 'startAutoPlay'];
    }
    activateNext(reverse = false) {
        const active = this.active + (reverse ? -1 : 1);
        if ((active < 0 || active > this.images.length - 1) && !this.autoRefresh) {
            return;
        }
        this.setActive((this.images.length + active) % this.images.length);
    }
    setTimer() {
        clearTimeout(this.nextTimer);
        if (this.autoScroll && this.playing) {
            this.nextTimer = setTimeout(() => {
                this.activateNext();
            }, this.scrollDuration * 1000);
        }
    }
}
NglCarousel.decorators = [
    { type: Component, args: [{
                selector: 'ngl-carousel',
                template: "\n<div class=\"slds-carousel__stage\"><span class=\"slds-carousel__autoplay\" *ngIf=\"autoScroll\">\n    <button class=\"slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small\" [attr.aria-pressed]=\"!playing\" [title]=\"playLabel()\" (click)=\"togglePlay()\">\n      <svg class=\"slds-button__icon\" [nglIconName]=\"playing ? 'utility:pause' : 'utility:right'\"></svg><span class=\"slds-assistive-text\">{{ playLabel() }}</span>\n    </button></span>\n  <div class=\"slds-carousel__panels\" [style.transform]=\"'translateX(' + (-active * 100) + '%)'\">\n    <ng-content></ng-content>\n  </div>\n  <ul class=\"slds-carousel__indicators\" #indicatorsEl role=\"tablist\" (keydown)=\"onKeyboard($event)\">\n    <li class=\"slds-carousel__indicator\" *ngFor=\"let image of images; let i = index\" role=\"presentation\"><a class=\"slds-carousel__indicator-action\" nglCarouselIndicator href=\"javascript:void(0);\" role=\"tab\" [isActive]=\"isActive(i)\" [image]=\"getImage(i)\" [attr.aria-controls]=\"image.uid\" [title]=\"image.header\" (click)=\"onIndicatorClick(i)\"><span class=\"slds-assistive-text\">{{ image.header }}</span></a></li>\n  </ul>\n</div>",
                changeDetection: ChangeDetectionStrategy.OnPush,
                host: {
                    '[class.slds-carousel]': 'true',
                }
            },] }
];
NglCarousel.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] }
];
NglCarousel.propDecorators = {
    active: [{ type: Input }],
    activeChange: [{ type: Output }],
    scrollDuration: [{ type: Input }],
    autoScroll: [{ type: Input }],
    autoRefresh: [{ type: Input }],
    images: [{ type: ContentChildren, args: [NglCarouselImage,] }],
    indicators: [{ type: ViewChildren, args: [NglCarouselIndicator,] }],
    indicatorsEl: [{ type: ViewChild, args: ['indicatorsEl', { static: true },] }],
    labels: [{ type: Input }]
};
__decorate([
    InputNumber()
], NglCarousel.prototype, "active", void 0);
__decorate([
    InputNumber()
], NglCarousel.prototype, "scrollDuration", void 0);
__decorate([
    InputBoolean()
], NglCarousel.prototype, "autoScroll", void 0);
__decorate([
    InputBoolean()
], NglCarousel.prototype, "autoRefresh", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2Fyb3VzZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZy1saWdodG5pbmcvc3JjL2xpYi9jYXJvdXNlbC9jYXJvdXNlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsZUFBZSxFQUNqRSxNQUFNLEVBQUUsWUFBWSxFQUFhLFlBQVksRUFBaUIsU0FBUyxFQUFjLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDL0gsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQzNDLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDaEUsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUM1RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNwRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQVU1RCxNQUFNLE9BQU8sV0FBVztJQW9DdEIsWUFBa0QsUUFBYTtRQUFiLGFBQVEsR0FBUixRQUFRLENBQUs7UUFoQ3JELGlCQUFZLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUVwRDs7V0FFRztRQUNxQixtQkFBYyxHQUFHLENBQUMsQ0FBQztRQUUzQzs7V0FFRztRQUNzQixlQUFVLEdBQUcsSUFBSSxDQUFDO1FBRTNDOztXQUVHO1FBQ3NCLGdCQUFXLEdBQUcsSUFBSSxDQUFDO1FBUTFCLFdBQU0sR0FBRztZQUN6QixhQUFhLEVBQUUsaUJBQWlCO1lBQ2hDLFlBQVksRUFBRSxnQkFBZ0I7U0FDL0IsQ0FBQztRQUVGLFlBQU8sR0FBRyxJQUFJLENBQUM7UUFFUCxjQUFTLEdBQUcsSUFBSSxDQUFDO0lBRXlDLENBQUM7SUFFbkUsUUFBUSxDQUFDLEtBQWE7UUFDcEIsT0FBTyxLQUFLLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUMvQixDQUFDO0lBRUQsUUFBUSxDQUFDLEtBQWE7UUFDcEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxXQUFXLENBQUMsT0FBc0I7UUFDaEMsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO1lBQ2xCLG9EQUFvRDtZQUNwRCxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDckYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDaEQ7U0FDRjtRQUVELElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsVUFBVSxJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUU7WUFDbEUsa0NBQWtDO1lBQ2xDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUNqQjtJQUNILENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxLQUFhO1FBQzVCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxVQUFVLENBQUMsR0FBa0I7UUFDM0IsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLFVBQVUsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLFdBQVcsRUFBRTtZQUM3RCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEtBQUssVUFBVSxDQUFDLENBQUM7U0FDL0M7SUFDSCxDQUFDO0lBRUQsU0FBUyxDQUFDLEtBQWEsRUFBRSxXQUFXLEdBQUcsS0FBSztRQUMxQyxJQUFJLFdBQVcsRUFBRTtZQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1NBQ3RCO1FBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLEtBQUssRUFBRTtZQUN6QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMvQjtJQUNILENBQUM7SUFFRCxVQUFVO1FBQ1IsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDN0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUVPLFlBQVksQ0FBQyxPQUFPLEdBQUcsS0FBSztRQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFaEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUN4RSxPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRU8sUUFBUTtRQUNkLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFN0IsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUMvQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdEIsQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDaEM7SUFDSCxDQUFDOzs7WUFuSEYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxjQUFjO2dCQUN4QiwycUNBQThCO2dCQUM5QixlQUFlLEVBQUUsdUJBQXVCLENBQUMsTUFBTTtnQkFDL0MsSUFBSSxFQUFFO29CQUNKLHVCQUF1QixFQUFFLE1BQU07aUJBQ2hDO2FBQ0Y7Ozs0Q0FxQ2MsUUFBUSxZQUFJLE1BQU0sU0FBQyxRQUFROzs7cUJBbEN2QyxLQUFLOzJCQUVMLE1BQU07NkJBS04sS0FBSzt5QkFLTCxLQUFLOzBCQUtMLEtBQUs7cUJBRUwsZUFBZSxTQUFDLGdCQUFnQjt5QkFFaEMsWUFBWSxTQUFDLG9CQUFvQjsyQkFFakMsU0FBUyxTQUFDLGNBQWMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7cUJBRTFDLEtBQUs7O0FBekJrQjtJQUFkLFdBQVcsRUFBRTsyQ0FBaUI7QUFPaEI7SUFBZCxXQUFXLEVBQUU7bURBQW9CO0FBS2xCO0lBQWYsWUFBWSxFQUFFOytDQUFtQjtBQUtsQjtJQUFmLFlBQVksRUFBRTtnREFBb0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIElucHV0LCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgQ29udGVudENoaWxkcmVuLCBRdWVyeUxpc3QsXG4gIE91dHB1dCwgRXZlbnRFbWl0dGVyLCBPbkNoYW5nZXMsIFZpZXdDaGlsZHJlbiwgU2ltcGxlQ2hhbmdlcywgVmlld0NoaWxkLCBFbGVtZW50UmVmLCBPcHRpb25hbCwgSW5qZWN0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBET0NVTUVOVCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBMRUZUX0FSUk9XLCBSSUdIVF9BUlJPVyB9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQgeyBJbnB1dEJvb2xlYW4sIElucHV0TnVtYmVyIH0gZnJvbSAnLi4vdXRpbC9jb252ZXJ0JztcbmltcG9ydCB7IE5nbENhcm91c2VsSW1hZ2UgfSBmcm9tICcuL2Nhcm91c2VsLWltYWdlJztcbmltcG9ydCB7IE5nbENhcm91c2VsSW5kaWNhdG9yIH0gZnJvbSAnLi9jYXJvdXNlbC1pbmRpY2F0b3InO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICduZ2wtY2Fyb3VzZWwnLFxuICB0ZW1wbGF0ZVVybDogJy4vY2Fyb3VzZWwuaHRtbCcsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICBob3N0OiB7XG4gICAgJ1tjbGFzcy5zbGRzLWNhcm91c2VsXSc6ICd0cnVlJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgTmdsQ2Fyb3VzZWwgaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuXG4gIEBJbnB1dCgpIEBJbnB1dE51bWJlcigpIHJlYWRvbmx5IGFjdGl2ZTtcblxuICBAT3V0cHV0KCkgYWN0aXZlQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSBhdXRvIHNjcm9sbCBkdXJhdGlvbiBpbiBzZWNvbmRzLiBBZnRlciB0aGF0IHRoZSBuZXh0IGltYWdlIGlzIGRpc3BsYXllZC5cbiAgICovXG4gIEBJbnB1dCgpIEBJbnB1dE51bWJlcigpIHNjcm9sbER1cmF0aW9uID0gNTtcblxuICAvKipcbiAgICogV2hldGhlciBhdXRvIHNjcm9sbCBpcyBlbmFibGVkLlxuICAgKi9cbiAgQElucHV0KCkgQElucHV0Qm9vbGVhbigpIGF1dG9TY3JvbGwgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBjYXJvdXNlbCBzaG91bGQgY29udGludWUgbG9vcGluZyBmcm9tIHRoZSBiZWdpbm5pbmcgYWZ0ZXIgdGhlIGxhc3QgaXRlbSBpcyBkaXNwbGF5ZWQuXG4gICAqL1xuICBASW5wdXQoKSBASW5wdXRCb29sZWFuKCkgYXV0b1JlZnJlc2ggPSB0cnVlO1xuXG4gIEBDb250ZW50Q2hpbGRyZW4oTmdsQ2Fyb3VzZWxJbWFnZSkgaW1hZ2VzOiBRdWVyeUxpc3Q8TmdsQ2Fyb3VzZWxJbWFnZT47XG5cbiAgQFZpZXdDaGlsZHJlbihOZ2xDYXJvdXNlbEluZGljYXRvcikgaW5kaWNhdG9yczogUXVlcnlMaXN0PE5nbENhcm91c2VsSW5kaWNhdG9yPjtcblxuICBAVmlld0NoaWxkKCdpbmRpY2F0b3JzRWwnLCB7IHN0YXRpYzogdHJ1ZSB9KSBpbmRpY2F0b3JzRWw6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+O1xuXG4gIEBJbnB1dCgpIHJlYWRvbmx5IGxhYmVscyA9IHtcbiAgICBzdGFydEF1dG9QbGF5OiAnU3RhcnQgYXV0by1wbGF5JyxcbiAgICBzdG9wQXV0b1BsYXk6ICdTdG9wIGF1dG8tcGxheScsXG4gIH07XG5cbiAgcGxheWluZyA9IHRydWU7XG5cbiAgcHJpdmF0ZSBuZXh0VGltZXIgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKEBPcHRpb25hbCgpIEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgZG9jdW1lbnQ6IGFueSkge31cblxuICBpc0FjdGl2ZShpbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIGluZGV4ID09PSB0aGlzLmFjdGl2ZTtcbiAgfVxuXG4gIGdldEltYWdlKGluZGV4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5pbWFnZXMudG9BcnJheSgpW2luZGV4XTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBpZiAoY2hhbmdlcy5hY3RpdmUpIHtcbiAgICAgIC8vIEZvY3VzIGNvcnJlY3QgaW5kaWNhdG9yIGlmIG9uZSBpcyBhbHJlYWR5IGZvY3VzZWRcbiAgICAgIGlmICh0aGlzLmRvY3VtZW50ICYmIHRoaXMuaW5kaWNhdG9yc0VsLm5hdGl2ZUVsZW1lbnQuY29udGFpbnMoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkpIHtcbiAgICAgICAgdGhpcy5pbmRpY2F0b3JzLnRvQXJyYXkoKVt0aGlzLmFjdGl2ZV0uZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlcy5hY3RpdmUgfHwgY2hhbmdlcy5hdXRvU2Nyb2xsIHx8IGNoYW5nZXMuc2Nyb2xsRHVyYXRpb24pIHtcbiAgICAgIC8vIFJlc2V0IHRpbWVyIHdoZW4gYWN0aXZlIGNoYW5nZXNcbiAgICAgIHRoaXMuc2V0VGltZXIoKTtcbiAgICB9XG4gIH1cblxuICBvbkluZGljYXRvckNsaWNrKGluZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnNldEFjdGl2ZShpbmRleCwgdHJ1ZSk7XG4gIH1cblxuICBvbktleWJvYXJkKGV2dDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmIChldnQua2V5Q29kZSA9PT0gTEVGVF9BUlJPVyB8fCBldnQua2V5Q29kZSA9PT0gUklHSFRfQVJST1cpIHtcbiAgICAgIHRoaXMuYWN0aXZhdGVOZXh0KGV2dC5rZXlDb2RlID09PSBMRUZUX0FSUk9XKTtcbiAgICB9XG4gIH1cblxuICBzZXRBY3RpdmUoaW5kZXg6IG51bWJlciwgc3RvcFBsYXlpbmcgPSBmYWxzZSkge1xuICAgIGlmIChzdG9wUGxheWluZykge1xuICAgICAgdGhpcy5wbGF5aW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYWN0aXZlICE9PSBpbmRleCkge1xuICAgICAgdGhpcy5hY3RpdmVDaGFuZ2UuZW1pdChpbmRleCk7XG4gICAgfVxuICB9XG5cbiAgdG9nZ2xlUGxheSgpIHtcbiAgICB0aGlzLnBsYXlpbmcgPSAhdGhpcy5wbGF5aW5nO1xuICAgIHRoaXMuc2V0VGltZXIoKTtcbiAgfVxuXG4gIHBsYXlMYWJlbCgpIHtcbiAgICByZXR1cm4gdGhpcy5sYWJlbHNbdGhpcy5wbGF5aW5nID8gJ3N0b3BBdXRvUGxheScgOiAnc3RhcnRBdXRvUGxheSddO1xuICB9XG5cbiAgcHJpdmF0ZSBhY3RpdmF0ZU5leHQocmV2ZXJzZSA9IGZhbHNlKTogdm9pZCB7XG4gICAgY29uc3QgYWN0aXZlID0gdGhpcy5hY3RpdmUgKyAocmV2ZXJzZSA/IC0xIDogMSk7XG5cbiAgICBpZiAoKGFjdGl2ZSA8IDAgfHwgYWN0aXZlID4gdGhpcy5pbWFnZXMubGVuZ3RoIC0gMSkgJiYgIXRoaXMuYXV0b1JlZnJlc2gpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldEFjdGl2ZSgodGhpcy5pbWFnZXMubGVuZ3RoICsgYWN0aXZlKSAlIHRoaXMuaW1hZ2VzLmxlbmd0aCk7XG4gIH1cblxuICBwcml2YXRlIHNldFRpbWVyKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLm5leHRUaW1lcik7XG5cbiAgICBpZiAodGhpcy5hdXRvU2Nyb2xsICYmIHRoaXMucGxheWluZykge1xuICAgICAgdGhpcy5uZXh0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5hY3RpdmF0ZU5leHQoKTtcbiAgICAgIH0sIHRoaXMuc2Nyb2xsRHVyYXRpb24gKiAxMDAwKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==