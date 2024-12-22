import subjectLoose from '@/music-theory-subject.json'
import unitsLoose from '@/music-theory.json'
import type { Subject } from '@/types'
import type { Content } from '@/types/content';

let subject = subjectLoose as Subject;
let units = unitsLoose as unknown as Content[];

export {units, subject};
