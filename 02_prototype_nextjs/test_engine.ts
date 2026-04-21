import { calculateProbabilities } from './src/lib/engine';

console.log("=== Test 1: Migräne Wahrscheinlichkeiten bei Frauen (30 J) vs Männern (60 J) ===");

const symptoms1 = ['sym_headache', 'sym_nausea'];

const resultsFemale = calculateProbabilities(symptoms1, 'adult', 'female');
const migraeneFemale = resultsFemale.find(r => r.disease_id === 'migraene');
console.log("Frau (30): Wahrscheinlichkeit für Migräne ->", migraeneFemale?.probability, "%");

const resultsMale = calculateProbabilities(symptoms1, 'senior', 'male');
const migraeneMale = resultsMale.find(r => r.disease_id === 'migraene');
console.log("Mann (60): Wahrscheinlichkeit für Migräne ->", migraeneMale?.probability, "%");

console.log("\n=== Test 2: Erkältung bei einem Kind (10 J) vs Erwachsenen (50 J) ===");
const symptoms2 = ['sym_cough', 'sym_runny_nose'];

const resultsChild = calculateProbabilities(symptoms2, 'child', 'other');
const coldChild = resultsChild.find(r => r.disease_id === 'erklaeltung');
console.log("Kind (10): Wahrscheinlichkeit für Erkältung ->", coldChild?.probability, "%");

const resultsAdult = calculateProbabilities(symptoms2, 'adult', 'other');
const coldAdult = resultsAdult.find(r => r.disease_id === 'erklaeltung');
console.log("Erwachsener (50): Wahrscheinlichkeit für Erkältung ->", coldAdult?.probability, "%");
