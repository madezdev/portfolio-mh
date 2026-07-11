import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register once. SSR-safe: ScrollTrigger self-guards when there is no window,
// and useGSAP is headless. Animations only run inside client-side useGSAP effects.
gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
