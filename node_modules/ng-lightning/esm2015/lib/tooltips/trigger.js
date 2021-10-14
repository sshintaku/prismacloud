import { __decorate } from "tslib";
import { Directive, Input, ElementRef, ViewContainerRef, Output, EventEmitter, Renderer2, HostListener, Optional, Inject } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NglTooltip } from './tooltip';
import { POSITION_MAP, DEFAULT_TOOLTIP_POSITIONS, getPlacementName } from '../util/overlay-position';
import { uniqueId } from '../util/util';
import { InputBoolean } from '../util/convert';
import { NGL_TOOLTIP_CONFIG, NglTooltipConfig } from './config';
export class NglTooltipTrigger {
    constructor(defaultConfig, element, renderer, viewContainerRef, overlay) {
        this.element = element;
        this.renderer = renderer;
        this.viewContainerRef = viewContainerRef;
        this.overlay = overlay;
        /**
         * Emit an event when actual tooltip is shown or hidden.
         */
        this.nglTooltipOpenChange = new EventEmitter();
        this.uid = uniqueId('tooltip');
        /** Names of properties that should be proxy to child component. */
        this.needProxyProperties = new Set([
            'template',
            'placement',
            'uid',
            'tooltipClass',
        ]);
        this.openDelay = 0;
        this.closeDelay = 0;
        this.toggleTimeout = null;
        this.overlayListeners = new Set();
        this.config = Object.assign(Object.assign({}, new NglTooltipConfig()), defaultConfig);
        this.openAuto = this.config.openAuto;
        this.interactive = this.config.interactive;
        this.delay = this.config.delay;
        this.renderer.setAttribute(this.element.nativeElement, 'aria-describedby', this.uid);
    }
    /**
     * Position relative to host element.
     */
    set placement(placement) {
        if (placement === this.placement) {
            return;
        }
        this._placement = placement;
        if (this.overlayRef) {
            this.updatePosition();
        }
    }
    get placement() {
        return this._placement || this.config.placement;
    }
    /**
     * Delay in milliseconds until it opens/closes.
     */
    set delay(_delay) {
        const delay = Array.isArray(_delay) ? _delay : [_delay, _delay];
        [this.openDelay, this.closeDelay] = delay.map(Number);
    }
    /**
     * Whether the floating tooltip is visible.
     */
    set nglOpen(open) {
        if (open === this.nglOpen) {
            return;
        }
        open ? this.create() : this.detach();
        this._open = open;
    }
    get nglOpen() {
        return this._open;
    }
    ngOnChanges(changes) {
        if (this.nglOpen) {
            this.updateProxies(changes);
            Promise.resolve().then(() => {
                if (this.overlayRef) {
                    this.overlayRef.updatePosition();
                }
            });
        }
    }
    onMouseOver() {
        this.open();
    }
    onMouseOut() {
        this.close();
        if (this.overlayRef && !this.overlayElement && this.interactive) {
            this.overlayElement = this.overlayRef.overlayElement;
            this.overlayListeners.add(this.renderer.listen(this.overlayElement, 'mouseenter', () => this.open()));
            this.overlayListeners.add(this.renderer.listen(this.overlayElement, 'mouseleave', () => this.close()));
        }
    }
    ngOnDestroy() {
        this.detach();
        this.close(0);
    }
    // Expose open method
    open(delay = this.openDelay) {
        this.handle(true, delay);
    }
    // Expose close method
    close(delay = this.closeDelay) {
        this.handle(false, delay);
    }
    // Expose toggle method
    toggle() {
        this.nglOpen ? this.close(0) : this.open(0);
    }
    handle(open, delay) {
        if (this.toggleTimeout !== null) {
            clearTimeout(this.toggleTimeout);
            this.toggleTimeout = null;
        }
        if (open !== this.nglOpen) {
            if (delay > 0) {
                this.toggleTimeout = setTimeout(() => {
                    this.toggleTimeout = null;
                    this.emitOpen(open);
                }, delay);
            }
            else {
                this.emitOpen(open);
            }
        }
    }
    emitOpen(open) {
        if (this.openAuto) {
            this.nglOpen = open;
        }
        this.nglTooltipOpenChange.emit(open);
    }
    create() {
        if (this.nglOpen) {
            return;
        }
        this.detach();
        const overlayRef = this.createOverlay();
        this.portal = this.portal || new ComponentPortal(NglTooltip, this.viewContainerRef);
        this.tooltip = overlayRef.attach(this.portal).instance;
        this.needProxyProperties.forEach(property => this.updateTooltip(property, this[property]));
    }
    /** Detaches the currently-attached tooltip. */
    detach() {
        if (this.overlayRef) {
            this.overlayRef.detach();
            this.overlayRef.dispose();
            this.overlayRef = null;
        }
        // Clean up the event listeners
        this.overlayListeners.forEach((unlisten) => unlisten());
        this.overlayListeners.clear();
        // Clear the overlay reference used for interactive mode
        if (this.interactive) {
            this.overlayElement = null;
        }
        if (this.positionChangesSubscription) {
            this.positionChangesSubscription.unsubscribe();
            this.positionChangesSubscription = null;
        }
        this.tooltip = null;
    }
    /** Create the overlay config and position strategy */
    createOverlay() {
        if (this.overlayRef) {
            return this.overlayRef;
        }
        // Create connected position strategy that listens for scroll events to reposition.
        const strategy = this.overlay.position()
            .flexibleConnectedTo(this.element)
            .withFlexibleDimensions(false)
            .withViewportMargin(8)
            .withPush(false);
        this.positionChangesSubscription = strategy.positionChanges
            .pipe(map(change => getPlacementName(change, this.placement)), distinctUntilChanged())
            .subscribe((placement) => {
            this.updatePosition();
            this.updateTooltip('placement', placement);
        });
        this.overlayRef = this.overlay.create({
            positionStrategy: strategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
        });
        this.updatePosition();
        return this.overlayRef;
    }
    /** Updates the position of the current tooltip. */
    updatePosition() {
        const position = this.overlayRef.getConfig().positionStrategy;
        position.withPositions([
            POSITION_MAP[this.placement].position,
            ...DEFAULT_TOOLTIP_POSITIONS,
        ]);
    }
    updateTooltip(key, value) {
        this.tooltip[key] = value;
    }
    /**
     * Set inputs of child components when this component's inputs change.
     */
    updateProxies(changes) {
        Object.keys(changes)
            .filter(key => this.needProxyProperties.has(key))
            .forEach(key => this.updateTooltip(key, this[key]));
    }
}
NglTooltipTrigger.decorators = [
    { type: Directive, args: [{
                selector: '[nglTooltip]',
                exportAs: 'nglTooltip',
            },] }
];
NglTooltipTrigger.ctorParameters = () => [
    { type: NglTooltipConfig, decorators: [{ type: Optional }, { type: Inject, args: [NGL_TOOLTIP_CONFIG,] }] },
    { type: ElementRef },
    { type: Renderer2 },
    { type: ViewContainerRef },
    { type: Overlay }
];
NglTooltipTrigger.propDecorators = {
    template: [{ type: Input, args: ['nglTooltip',] }],
    placement: [{ type: Input, args: ['nglTooltipPlacement',] }],
    delay: [{ type: Input, args: ['nglTooltipDelay',] }],
    nglOpen: [{ type: Input, args: ['nglTooltipOpen',] }],
    openAuto: [{ type: Input, args: ['nglTooltipOpenAuto',] }],
    interactive: [{ type: Input, args: ['nglTooltipInteractive',] }],
    tooltipClass: [{ type: Input, args: ['nglTooltipClass',] }],
    nglTooltipOpenChange: [{ type: Output }],
    onMouseOver: [{ type: HostListener, args: ['mouseenter',] }, { type: HostListener, args: ['focus',] }],
    onMouseOut: [{ type: HostListener, args: ['mouseleave',] }, { type: HostListener, args: ['blur',] }]
};
__decorate([
    InputBoolean()
], NglTooltipTrigger.prototype, "openAuto", void 0);
__decorate([
    InputBoolean()
], NglTooltipTrigger.prototype, "interactive", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJpZ2dlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL25nLWxpZ2h0bmluZy9zcmMvbGliL3Rvb2x0aXBzL3RyaWdnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBZSxnQkFBZ0IsRUFDeEMsTUFBTSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDbkgsT0FBTyxFQUFjLE9BQU8sRUFBcUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM5RixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFFdEQsT0FBTyxFQUFFLEdBQUcsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzNELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxFQUFFLFlBQVksRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBYSxNQUFNLDBCQUEwQixDQUFDO0FBQ2hILE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDeEMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQU1oRSxNQUFNLE9BQU8saUJBQWlCO0lBNkY1QixZQUFvRCxhQUErQixFQUMvRCxPQUFtQixFQUNuQixRQUFtQixFQUNuQixnQkFBa0MsRUFDbEMsT0FBZ0I7UUFIaEIsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUNuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ25CLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQWhDcEM7O1dBRUc7UUFDTyx5QkFBb0Is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QUFPLENBQUUsR0FBRyxDQUFFLEdBQUcsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7T0FFRztJQUNLLGFBQWEsQ0FBQyxPQUFzQjtRQUMxQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzthQUNqQixNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FBQzs7O1lBblJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsY0FBYztnQkFDeEIsUUFBUSxFQUFFLFlBQVk7YUFDdkI7OztZQUw0QixnQkFBZ0IsdUJBbUc5QixRQUFRLFlBQUksTUFBTSxTQUFDLGtCQUFrQjtZQTdHekIsVUFBVTtZQUNhLFNBQVM7WUFEUCxnQkFBZ0I7WUFFL0MsT0FBTzs7O3VCQW1CekIsS0FBSyxTQUFDLFlBQVk7d0JBS2xCLEtBQUssU0FBQyxxQkFBcUI7b0JBbUIzQixLQUFLLFNBQUMsaUJBQWlCO3NCQVN2QixLQUFLLFNBQUMsZ0JBQWdCO3VCQWV0QixLQUFLLFNBQUMsb0JBQW9COzBCQUsxQixLQUFLLFNBQUMsdUJBQXVCOzJCQUs3QixLQUFLLFNBQUMsaUJBQWlCO21DQUt2QixNQUFNOzBCQWtETixZQUFZLFNBQUMsWUFBWSxjQUN6QixZQUFZLFNBQUMsT0FBTzt5QkFLcEIsWUFBWSxTQUFDLFlBQVksY0FDekIsWUFBWSxTQUFDLE1BQU07O0FBeEV5QjtJQUFmLFlBQVksRUFBRTttREFBbUI7QUFLZjtJQUFmLFlBQVksRUFBRTtzREFBc0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIElucHV0LCBFbGVtZW50UmVmLCBUZW1wbGF0ZVJlZiwgVmlld0NvbnRhaW5lclJlZiwgT25EZXN0cm95LFxuICBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZXMsIE91dHB1dCwgRXZlbnRFbWl0dGVyLCBSZW5kZXJlcjIsIEhvc3RMaXN0ZW5lciwgT3B0aW9uYWwsIEluamVjdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT3ZlcmxheVJlZiwgT3ZlcmxheSwgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IH0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHsgQ29tcG9uZW50UG9ydGFsIH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IG1hcCwgZGlzdGluY3RVbnRpbENoYW5nZWQgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBOZ2xUb29sdGlwIH0gZnJvbSAnLi90b29sdGlwJztcbmltcG9ydCB7IFBPU0lUSU9OX01BUCwgREVGQVVMVF9UT09MVElQX1BPU0lUSU9OUywgZ2V0UGxhY2VtZW50TmFtZSwgUGxhY2VtZW50IH0gZnJvbSAnLi4vdXRpbC9vdmVybGF5LXBvc2l0aW9uJztcbmltcG9ydCB7IHVuaXF1ZUlkIH0gZnJvbSAnLi4vdXRpbC91dGlsJztcbmltcG9ydCB7IElucHV0Qm9vbGVhbiB9IGZyb20gJy4uL3V0aWwvY29udmVydCc7XG5pbXBvcnQgeyBOR0xfVE9PTFRJUF9DT05GSUcsIE5nbFRvb2x0aXBDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tuZ2xUb29sdGlwXScsXG4gIGV4cG9ydEFzOiAnbmdsVG9vbHRpcCcsXG59KVxuZXhwb3J0IGNsYXNzIE5nbFRvb2x0aXBUcmlnZ2VyIGltcGxlbWVudHMgT25DaGFuZ2VzLCBPbkRlc3Ryb3kge1xuXG4gIC8qKlxuICAgKiBUaGUgY29udGVudCBhcyBzdHJpbmcgb3IgdGhlIGNvbm5lY3RlZCB0ZW1wbGF0ZSByZWZlcmVuY2UgdG8gc2hvdy5cbiAgICovXG4gIEBJbnB1dCgnbmdsVG9vbHRpcCcpIHRlbXBsYXRlOiBzdHJpbmcgfCBUZW1wbGF0ZVJlZjx2b2lkPjtcblxuICAvKipcbiAgICogUG9zaXRpb24gcmVsYXRpdmUgdG8gaG9zdCBlbGVtZW50LlxuICAgKi9cbiAgQElucHV0KCduZ2xUb29sdGlwUGxhY2VtZW50JylcbiAgc2V0IHBsYWNlbWVudChwbGFjZW1lbnQ6IFBsYWNlbWVudCkge1xuICAgIGlmIChwbGFjZW1lbnQgPT09IHRoaXMucGxhY2VtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fcGxhY2VtZW50ID0gcGxhY2VtZW50O1xuXG4gICAgaWYgKHRoaXMub3ZlcmxheVJlZikge1xuICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xuICAgIH1cbiAgfVxuICBnZXQgcGxhY2VtZW50KCkge1xuICAgIHJldHVybiB0aGlzLl9wbGFjZW1lbnQgfHwgdGhpcy5jb25maWcucGxhY2VtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGF5IGluIG1pbGxpc2Vjb25kcyB1bnRpbCBpdCBvcGVucy9jbG9zZXMuXG4gICAqL1xuICBASW5wdXQoJ25nbFRvb2x0aXBEZWxheScpXG4gIHNldCBkZWxheShfZGVsYXk6IGFueSB8IGFueVtdKSB7XG4gICAgY29uc3QgZGVsYXkgPSBBcnJheS5pc0FycmF5KF9kZWxheSkgPyBfZGVsYXkgOiBbX2RlbGF5LCBfZGVsYXldO1xuICAgIFt0aGlzLm9wZW5EZWxheSwgdGhpcy5jbG9zZURlbGF5XSA9IGRlbGF5Lm1hcChOdW1iZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGZsb2F0aW5nIHRvb2x0aXAgaXMgdmlzaWJsZS5cbiAgICovXG4gIEBJbnB1dCgnbmdsVG9vbHRpcE9wZW4nKSBzZXQgbmdsT3BlbihvcGVuOiBib29sZWFuKSB7XG4gICAgaWYgKG9wZW4gPT09IHRoaXMubmdsT3Blbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9wZW4gPyB0aGlzLmNyZWF0ZSgpIDogdGhpcy5kZXRhY2goKTtcbiAgICB0aGlzLl9vcGVuID0gb3BlbjtcbiAgfVxuICBnZXQgbmdsT3BlbigpIHtcbiAgICByZXR1cm4gdGhpcy5fb3BlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuL2Nsb3NlIHdpdGhvdXQgdHdvLXdheSBiaW5kaW5nIGlucHV0LlxuICAgKi9cbiAgQElucHV0KCduZ2xUb29sdGlwT3BlbkF1dG8nKSBASW5wdXRCb29sZWFuKCkgb3BlbkF1dG86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEdpdmVzIHRoZSBwb3NzaWJpbGl0eSB0byBpbnRlcmFjdCB3aXRoIHRoZSBjb250ZW50IG9mIHRoZSBwb3BvdmVyLlxuICAgKi9cbiAgQElucHV0KCduZ2xUb29sdGlwSW50ZXJhY3RpdmUnKSBASW5wdXRCb29sZWFuKCkgaW50ZXJhY3RpdmU6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEV4dHJhIGNsYXNzKGVzKSB5b3Ugd2FudCB0byBhcHBseSB0byB0b29sdGlwIGhvc3QgZWxlbWVudC5cbiAgICovXG4gIEBJbnB1dCgnbmdsVG9vbHRpcENsYXNzJykgdG9vbHRpcENsYXNzOiBhbnk7XG5cbiAgLyoqXG4gICAqIEVtaXQgYW4gZXZlbnQgd2hlbiBhY3R1YWwgdG9vbHRpcCBpcyBzaG93biBvciBoaWRkZW4uXG4gICAqL1xuICBAT3V0cHV0KCkgbmdsVG9vbHRpcE9wZW5DaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KCk7XG5cbiAgdWlkID0gdW5pcXVlSWQoJ3Rvb2x0aXAnKTtcblxuICAvKiogTmFtZXMgb2YgcHJvcGVydGllcyB0aGF0IHNob3VsZCBiZSBwcm94eSB0byBjaGlsZCBjb21wb25lbnQuICovXG4gIHByaXZhdGUgbmVlZFByb3h5UHJvcGVydGllcyA9IG5ldyBTZXQoW1xuICAgICd0ZW1wbGF0ZScsXG4gICAgJ3BsYWNlbWVudCcsXG4gICAgJ3VpZCcsXG4gICAgJ3Rvb2x0aXBDbGFzcycsXG4gIF0pO1xuICBwcml2YXRlIF9wbGFjZW1lbnQ6IFBsYWNlbWVudDtcbiAgcHJpdmF0ZSBfb3BlbjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxOZ2xUb29sdGlwPjtcbiAgcHJpdmF0ZSBvdmVybGF5UmVmOiBPdmVybGF5UmVmIHwgbnVsbDtcbiAgcHJpdmF0ZSB0b29sdGlwOiBOZ2xUb29sdGlwIHwgbnVsbDtcbiAgcHJpdmF0ZSBvcGVuRGVsYXkgPSAwO1xuICBwcml2YXRlIGNsb3NlRGVsYXkgPSAwO1xuICBwcml2YXRlIHRvZ2dsZVRpbWVvdXQ6IGFueSA9IG51bGw7XG4gIHByaXZhdGUgcG9zaXRpb25DaGFuZ2VzU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIHByaXZhdGUgb3ZlcmxheUxpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcbiAgcHJpdmF0ZSBvdmVybGF5RWxlbWVudDtcblxuICBwcml2YXRlIGNvbmZpZzogTmdsVG9vbHRpcENvbmZpZztcblxuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBASW5qZWN0KE5HTF9UT09MVElQX0NPTkZJRykgZGVmYXVsdENvbmZpZzogTmdsVG9vbHRpcENvbmZpZyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBlbGVtZW50OiBFbGVtZW50UmVmLFxuICAgICAgICAgICAgICBwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgICAgICAgICAgIHByaXZhdGUgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBvdmVybGF5OiBPdmVybGF5KSB7XG4gICAgdGhpcy5jb25maWcgPSB7IC4uLm5ldyBOZ2xUb29sdGlwQ29uZmlnKCksIC4uLmRlZmF1bHRDb25maWcgfTtcbiAgICB0aGlzLm9wZW5BdXRvID0gdGhpcy5jb25maWcub3BlbkF1dG87XG4gICAgdGhpcy5pbnRlcmFjdGl2ZSA9IHRoaXMuY29uZmlnLmludGVyYWN0aXZlO1xuICAgIHRoaXMuZGVsYXkgPSB0aGlzLmNvbmZpZy5kZWxheTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QXR0cmlidXRlKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScsIHRoaXMudWlkKTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBpZiAodGhpcy5uZ2xPcGVuKSB7XG4gICAgICB0aGlzLnVwZGF0ZVByb3hpZXMoY2hhbmdlcyk7XG5cbiAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5vdmVybGF5UmVmKSB7XG4gICAgICAgICAgdGhpcy5vdmVybGF5UmVmLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ21vdXNlZW50ZXInKVxuICBASG9zdExpc3RlbmVyKCdmb2N1cycpXG4gIG9uTW91c2VPdmVyKCkge1xuICAgIHRoaXMub3BlbigpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignbW91c2VsZWF2ZScpXG4gIEBIb3N0TGlzdGVuZXIoJ2JsdXInKVxuICBvbk1vdXNlT3V0KCkge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICBpZiAodGhpcy5vdmVybGF5UmVmICYmICF0aGlzLm92ZXJsYXlFbGVtZW50ICYmIHRoaXMuaW50ZXJhY3RpdmUpIHtcbiAgICAgIHRoaXMub3ZlcmxheUVsZW1lbnQgPSB0aGlzLm92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQ7XG4gICAgICB0aGlzLm92ZXJsYXlMaXN0ZW5lcnMuYWRkKHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMub3ZlcmxheUVsZW1lbnQsICdtb3VzZWVudGVyJywgKCkgPT4gdGhpcy5vcGVuKCkpKTtcbiAgICAgIHRoaXMub3ZlcmxheUxpc3RlbmVycy5hZGQodGhpcy5yZW5kZXJlci5saXN0ZW4odGhpcy5vdmVybGF5RWxlbWVudCwgJ21vdXNlbGVhdmUnLCAoKSA9PiB0aGlzLmNsb3NlKCkpKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIHRoaXMuY2xvc2UoMCk7XG4gIH1cblxuICAvLyBFeHBvc2Ugb3BlbiBtZXRob2RcbiAgb3BlbihkZWxheSA9IHRoaXMub3BlbkRlbGF5KTogdm9pZCB7XG4gICAgdGhpcy5oYW5kbGUodHJ1ZSwgZGVsYXkpO1xuICB9XG5cbiAgLy8gRXhwb3NlIGNsb3NlIG1ldGhvZFxuICBjbG9zZShkZWxheSA9IHRoaXMuY2xvc2VEZWxheSk6IHZvaWQge1xuICAgIHRoaXMuaGFuZGxlKGZhbHNlLCBkZWxheSk7XG4gIH1cblxuICAvLyBFeHBvc2UgdG9nZ2xlIG1ldGhvZFxuICB0b2dnbGUoKTogdm9pZCB7XG4gICAgdGhpcy5uZ2xPcGVuID8gdGhpcy5jbG9zZSgwKSA6IHRoaXMub3BlbigwKTtcbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlKG9wZW46IGJvb2xlYW4sIGRlbGF5OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50b2dnbGVUaW1lb3V0ICE9PSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50b2dnbGVUaW1lb3V0KTtcbiAgICAgIHRoaXMudG9nZ2xlVGltZW91dCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKG9wZW4gIT09IHRoaXMubmdsT3Blbikge1xuICAgICAgaWYgKGRlbGF5ID4gMCkge1xuICAgICAgICB0aGlzLnRvZ2dsZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLnRvZ2dsZVRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIHRoaXMuZW1pdE9wZW4ob3Blbik7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZW1pdE9wZW4ob3Blbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBlbWl0T3BlbihvcGVuKSB7XG4gICAgaWYgKHRoaXMub3BlbkF1dG8pIHtcbiAgICAgIHRoaXMubmdsT3BlbiA9IG9wZW47XG4gICAgfVxuICAgIHRoaXMubmdsVG9vbHRpcE9wZW5DaGFuZ2UuZW1pdChvcGVuKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5nbE9wZW4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRldGFjaCgpO1xuXG4gICAgY29uc3Qgb3ZlcmxheVJlZiA9IHRoaXMuY3JlYXRlT3ZlcmxheSgpO1xuXG4gICAgdGhpcy5wb3J0YWwgPSB0aGlzLnBvcnRhbCB8fCBuZXcgQ29tcG9uZW50UG9ydGFsKE5nbFRvb2x0aXAsIHRoaXMudmlld0NvbnRhaW5lclJlZik7XG4gICAgdGhpcy50b29sdGlwID0gb3ZlcmxheVJlZi5hdHRhY2godGhpcy5wb3J0YWwpLmluc3RhbmNlO1xuXG4gICAgdGhpcy5uZWVkUHJveHlQcm9wZXJ0aWVzLmZvckVhY2gocHJvcGVydHkgPT4gdGhpcy51cGRhdGVUb29sdGlwKHByb3BlcnR5LCB0aGlzWyBwcm9wZXJ0eSBdKSk7XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIGN1cnJlbnRseS1hdHRhY2hlZCB0b29sdGlwLiAqL1xuICBwcml2YXRlIGRldGFjaCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLm92ZXJsYXlSZWYuZGV0YWNoKCk7XG4gICAgICB0aGlzLm92ZXJsYXlSZWYuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5vdmVybGF5UmVmID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAgdGhpcy5vdmVybGF5TGlzdGVuZXJzLmZvckVhY2goKHVubGlzdGVuKSA9PiB1bmxpc3RlbigpKTtcbiAgICB0aGlzLm92ZXJsYXlMaXN0ZW5lcnMuY2xlYXIoKTtcblxuICAgIC8vIENsZWFyIHRoZSBvdmVybGF5IHJlZmVyZW5jZSB1c2VkIGZvciBpbnRlcmFjdGl2ZSBtb2RlXG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpdmUpIHtcbiAgICAgIHRoaXMub3ZlcmxheUVsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBvc2l0aW9uQ2hhbmdlc1N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5wb3NpdGlvbkNoYW5nZXNTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMucG9zaXRpb25DaGFuZ2VzU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLnRvb2x0aXAgPSBudWxsO1xuICB9XG5cbiAgLyoqIENyZWF0ZSB0aGUgb3ZlcmxheSBjb25maWcgYW5kIHBvc2l0aW9uIHN0cmF0ZWd5ICovXG4gIHByaXZhdGUgY3JlYXRlT3ZlcmxheSgpOiBPdmVybGF5UmVmIHtcbiAgICBpZiAodGhpcy5vdmVybGF5UmVmKSB7XG4gICAgICByZXR1cm4gdGhpcy5vdmVybGF5UmVmO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBjb25uZWN0ZWQgcG9zaXRpb24gc3RyYXRlZ3kgdGhhdCBsaXN0ZW5zIGZvciBzY3JvbGwgZXZlbnRzIHRvIHJlcG9zaXRpb24uXG4gICAgY29uc3Qgc3RyYXRlZ3kgPSB0aGlzLm92ZXJsYXkucG9zaXRpb24oKVxuICAgICAgLmZsZXhpYmxlQ29ubmVjdGVkVG8odGhpcy5lbGVtZW50KVxuICAgICAgLndpdGhGbGV4aWJsZURpbWVuc2lvbnMoZmFsc2UpXG4gICAgICAud2l0aFZpZXdwb3J0TWFyZ2luKDgpXG4gICAgICAud2l0aFB1c2goZmFsc2UpO1xuXG4gICAgdGhpcy5wb3NpdGlvbkNoYW5nZXNTdWJzY3JpcHRpb24gPSBzdHJhdGVneS5wb3NpdGlvbkNoYW5nZXNcbiAgICAgIC5waXBlKG1hcChjaGFuZ2UgPT4gZ2V0UGxhY2VtZW50TmFtZShjaGFuZ2UsIHRoaXMucGxhY2VtZW50KSksIGRpc3RpbmN0VW50aWxDaGFuZ2VkKCkpXG4gICAgICAuc3Vic2NyaWJlKChwbGFjZW1lbnQ6IFBsYWNlbWVudCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMudXBkYXRlVG9vbHRpcCgncGxhY2VtZW50JywgcGxhY2VtZW50KTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5vdmVybGF5UmVmID0gdGhpcy5vdmVybGF5LmNyZWF0ZSh7XG4gICAgICBwb3NpdGlvblN0cmF0ZWd5OiBzdHJhdGVneSxcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiB0aGlzLm92ZXJsYXkuc2Nyb2xsU3RyYXRlZ2llcy5yZXBvc2l0aW9uKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XG5cbiAgICByZXR1cm4gdGhpcy5vdmVybGF5UmVmO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBjdXJyZW50IHRvb2x0aXAuICovXG4gIHByaXZhdGUgdXBkYXRlUG9zaXRpb24oKTogdm9pZCB7XG4gICAgY29uc3QgcG9zaXRpb24gPSA8RmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5PnRoaXMub3ZlcmxheVJlZi5nZXRDb25maWcoKS5wb3NpdGlvblN0cmF0ZWd5O1xuXG4gICAgcG9zaXRpb24ud2l0aFBvc2l0aW9ucyhbXG4gICAgICBQT1NJVElPTl9NQVBbdGhpcy5wbGFjZW1lbnRdLnBvc2l0aW9uLFxuICAgICAgLi4uREVGQVVMVF9UT09MVElQX1BPU0lUSU9OUyxcbiAgICBdKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlVG9vbHRpcChrZXk6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgIHRoaXMudG9vbHRpcFsga2V5IF0gPSB2YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaW5wdXRzIG9mIGNoaWxkIGNvbXBvbmVudHMgd2hlbiB0aGlzIGNvbXBvbmVudCdzIGlucHV0cyBjaGFuZ2UuXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVByb3hpZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIE9iamVjdC5rZXlzKGNoYW5nZXMpXG4gICAgICAuZmlsdGVyKGtleSA9PiB0aGlzLm5lZWRQcm94eVByb3BlcnRpZXMuaGFzKGtleSkpXG4gICAgICAuZm9yRWFjaChrZXkgPT4gdGhpcy51cGRhdGVUb29sdGlwKGtleSwgdGhpc1trZXldKSk7XG4gIH1cbn1cbiJdfQ==