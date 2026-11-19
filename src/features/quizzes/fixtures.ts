import type { Difficulty, Question } from './types';

export const documents = [
	{ id: 'doc-physiology', title: 'Physiology of the ear, nose and throat' },
	{ id: 'doc-structures', title: 'Structures of the ear, nose and throat' }
];

type Seed = [
	documentId: string,
	topic: string,
	bloomLevel: string,
	stem: string,
	choices: [string, string, string, string],
	correctIndex: number,
	explanation: string
];

const seeds: Seed[] = [
	[
		'doc-physiology',
		'Hearing',
		'C1',
		'Which structure converts sound-pressure waves in the cochlear fluid into nerve impulses?',
		['Tympanic membrane', 'Organ of Corti', 'Stapes footplate', 'Eustachian tube'],
		1,
		'Hair cells of the organ of Corti transduce basilar membrane movement into neural signals.'
	],
	[
		'doc-physiology',
		'Hearing',
		'C2',
		'Why do the ossicles amplify sound on its way to the inner ear?',
		[
			'They store sound energy',
			'The tympanic membrane is smaller than the oval window',
			'The oval window is smaller than the tympanic membrane',
			'They block low frequencies'
		],
		2,
		'Force collected over the large tympanic membrane is concentrated on the small oval window, raising pressure.'
	],
	[
		'doc-physiology',
		'Hearing',
		'C1',
		'Which cranial nerve carries auditory information from the cochlea toward the brain?',
		['CN V', 'CN VII', 'CN VIII', 'CN X'],
		2,
		'The cochlear division of the vestibulocochlear nerve (CN VIII) carries hearing.'
	],
	[
		'doc-physiology',
		'Hearing',
		'C2',
		'Which part of the basilar membrane responds best to high-frequency sound?',
		['The apex', 'The base', 'The helicotrema', "Reissner's membrane"],
		1,
		'The stiff, narrow base resonates with high frequencies; the wide apex with low.'
	],
	[
		'doc-physiology',
		'Equilibrium',
		'C1',
		'Which structures detect angular acceleration of the head?',
		['Otolith organs', 'Semicircular canals', 'Cochlear duct', 'Round window'],
		1,
		'The cristae in the ampullae of the semicircular canals sense rotation.'
	],
	[
		'doc-physiology',
		'Equilibrium',
		'C3',
		'A patient spun in a chair stops suddenly and feels the room still spinning. Which mechanism explains this?',
		[
			'Endolymph keeps moving and deflects the cupula',
			'The otoliths detach',
			'The tympanic membrane stretches',
			'Perilymph pressure falls to zero'
		],
		0,
		'Inertia keeps endolymph flowing after the head stops, still deflecting the cupula.'
	],
	[
		'doc-physiology',
		'Equilibrium',
		'C4',
		'Why does benign paroxysmal positional vertigo appear with head position changes but not at rest?',
		[
			'Displaced otoconia move within a canal when the head tilts',
			'The cochlea loses pressure',
			'The facial nerve is compressed',
			'The tympanic membrane retracts'
		],
		0,
		'Loose otoconia drift in a semicircular canal and deflect the cupula only on certain movements.'
	],
	[
		'doc-physiology',
		'Olfaction',
		'C1',
		'Where are olfactory receptor neurons located?',
		[
			'Inferior turbinate',
			'Olfactory epithelium of the roof of the nasal cavity',
			'Nasal vestibule',
			'Maxillary sinus'
		],
		1,
		'Olfactory neurons lie in the specialised epithelium of the superior nasal cavity.'
	],
	[
		'doc-physiology',
		'Olfaction',
		'C2',
		'Through which bone do olfactory nerve fibres pass to reach the olfactory bulb?',
		['Sphenoid', 'Cribriform plate of the ethmoid', 'Vomer', 'Palatine'],
		1,
		'Olfactory filaments cross the cribriform plate of the ethmoid bone.'
	],
	[
		'doc-physiology',
		'Larynx',
		'C3',
		'During swallowing, which action protects the airway?',
		[
			'The epiglottis tilts over the laryngeal inlet',
			'The vocal folds abduct fully',
			'The soft palate lowers',
			'The hyoid moves downward'
		],
		0,
		'The larynx rises and the epiglottis covers the inlet while the folds adduct.'
	],
	[
		'doc-structures',
		'Ear anatomy',
		'C1',
		'Which structure equalises pressure between the middle ear and the nasopharynx?',
		['Eustachian tube', 'Round window', 'Cochlear aqueduct', 'Endolymphatic sac'],
		0,
		'The auditory (Eustachian) tube opens during swallowing and yawning.'
	],
	[
		'doc-structures',
		'Larynx anatomy',
		'C1',
		'Which cartilage is the only complete ring in the airway?',
		['Thyroid cartilage', 'Cricoid cartilage', 'Epiglottis', 'Arytenoid cartilage'],
		1,
		'The cricoid forms a complete ring below the thyroid cartilage.'
	]
];

const difficultyByBloom: Record<string, Difficulty> = {
	C1: 'easy',
	C2: 'easy',
	C3: 'medium',
	C4: 'hard'
};

export const fixtureQuestions: Question[] = seeds.map(
	([documentId, topic, bloomLevel, stem, choices, correctIndex, explanation], index) => {
		const number = index + 1;
		const options = choices.map((text, i) => ({
			id: `op-${number}-${'abcd'[i]}`,
			text
		}));
		return {
			id: `q-${String(number).padStart(3, '0')}`,
			revision: 1,
			documentId,
			sourceNumber: number,
			topic,
			stem,
			options,
			correctOptionId: options[correctIndex].id,
			bloomLevel,
			difficulty: difficultyByBloom[bloomLevel],
			explanation
		};
	}
);
