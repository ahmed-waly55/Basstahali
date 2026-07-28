import { Routes } from '@angular/router';

export const routes: Routes = [
    // Landing
    {path:"", redirectTo:"/home", pathMatch:"full"},
    {path: "", loadComponent:()=> import("./layouts/landing-layout/landing-layout.component").then(m => m.LandingLayoutComponent), title:"بسطهالي | منصة تعليمية ذكية لشرح المناهج الدراسية", 
    children:[
        {path:"home", loadComponent:()=> import("./Features/landing/landing.component").then(m => m.LandingComponent)},
        {path:"about", loadComponent:()=> import('./Features/about/about.component').then(m => m.AboutComponent)}
    ]},

    {path:"**" , loadComponent:()=> import("./shared/not-found/not-found.component").then(m => m.NotFoundComponent)}

];
