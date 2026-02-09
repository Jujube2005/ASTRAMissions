import { Component } from '@angular/core';
import { ThreeDTiltDirective } from '../_directives/three-d-tilt.directive';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [ThreeDTiltDirective],
    templateUrl: './about.html',
    styleUrls: ['./about.scss']
})
export class About {

}
