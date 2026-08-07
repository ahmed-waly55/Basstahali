import { Routes } from '@angular/router';

export const routes: Routes = [
    // Landing
    {path:"", redirectTo:"/home", pathMatch:"full"},
    {path: "", loadComponent:()=> import("./layouts/landing-layout/landing-layout.component").then(m => m.LandingLayoutComponent), title:"بسطهالي | منصة تعليمية ذكية لشرح المناهج الدراسية",
    children:[
        {path:"home", loadComponent:()=> import("./Features/landing/landing.component").then(m => m.LandingComponent)},
        {path:"about", loadComponent:()=> import('./Features/about/about.component').then(m => m.AboutComponent)},
        {path: "courses", loadComponent:()=> import("./Features/courses/courses.component").then(m => m.CoursesComponent), title:"بسطهالي | الدورات التعليمية"},
        {path: "teachers", loadComponent:()=> import("./Features/teachers/teachers.component").then(m => m.TeachersComponent), title:"بسطهالي | المدرسين"},
        {path:"contact" , loadComponent:()=> import("./Features/contact/contact.component").then(m => m.ContactComponent), title:"بسطهالي | تواصل معنا"},
        {path : "pricing" , loadComponent:()=> import("./Features/pricing/pricing.component").then(m => m.PricingComponent), title:"بسطهالي | خطط الاشتراك"},
        {path : "curriculum" , loadComponent:()=> import("./Features/curriculum/curriculum.component").then(m => m.CurriculumComponent), title:"بسطهالي | المناهج الدراسية"},
        {path: "features" , loadComponent:()=> import("./Features/features/features.component").then(m => m.FeaturesComponent), title:"بسطهالي | مميزات المنصة"},
        // {path: "curriculum/:stageId" , loadComponent:()=> import("./Features/curriculum/curriculum.component").then(m => m.CurriculumComponent), title:"بسطهالي | المناهج الدراسية"},

    ]},







    {path:"**" , loadComponent:()=> import("./shared/not-found/not-found.component").then(m => m.NotFoundComponent)}

];
