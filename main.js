// Diatonic Chord Trigger

var notes = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];
var qualities = ["Major", "Natural Minor", "Harmonic Minor", "Jazz Minor"];

var PluginParameters = [
  { name: "Parent Key", type: "menu", valueStrings:notes, defaultValue: 0 },
  { name: "Quality", type: "menu", valueStrings: qualities, defaultValue: 0 }
];
var debug = false;

function rootKey() {
  return GetParameter("Parent Key");
}

function keyQuality() {
  return GetParameter("Quality");
}

function playChord(events) {
	Trace(events);
		 for (var i = 0; i < events.length; i += 1) {
		    if (debug) {
		      events[i].trace();
		    }
		    events[i].send();
  }
}

function copyNote(event) {
  var copy = new event.constructor();
  copy.pitch = event.pitch;
  copy.velocity = event.velocity;
  return copy;
}

function noteAtSemitonesFrom(event, semitones) {
  var note = new event.constructor();
  note.pitch = event.pitch + semitones;
  note.velocity = event.velocity;
  return note;
}

function semitoneDifferenceFromRoot(pitch) {
  var semitones = (pitch - rootKey()) % 12;
  if (debug) {
    Trace(pitch);
    Trace(semitones);
  }
  return semitones;
}


// Interval Lookup

function majorThirdIntervalFrom(event) {
	Trace('maj 3');
  return noteAtSemitonesFrom(event, 4);
}

function minorThirdIntervalFrom(event) {
	Trace('min 3');
  return noteAtSemitonesFrom(event, 3);
}

function diminishedFifthIntervalFrom(event) {
	Trace('dim 5');
  return noteAtSemitonesFrom(event, 6);
}

function perfectFifthIntervalFrom(event) {
	Trace('perf 5');
  return noteAtSemitonesFrom(event, 7);
}

function augmentedFifthIntervalFrom(event) {
	Trace('aug 5');
  return noteAtSemitonesFrom(event, 8);
}

function majorSixthIntervalFrom(event) {
	Trace('maj 6');
  return noteAtSemitonesFrom(event, 9);
}

function minorSeventhIntervalFrom(event) {
	Trace('min 7');
  return noteAtSemitonesFrom(event, 10);
}

function majorSeventhIntervalFrom(event) {
	Trace('maj 7');
  return noteAtSemitonesFrom(event, 11);
}

function octaveAbove(event) {
	Trace('oct');
  return noteAtSemitonesFrom(event, 12);
}

// Chord Constructors 

// Ma7
function majorChordWithRoot(event) {
	Trace('- maj chord');
  var notes = [
    event,
    majorThirdIntervalFrom(event),
    perfectFifthIntervalFrom(event),
    majorSeventhIntervalFrom(event),
    octaveAbove(event)
  ];
  return notes;
}

// Min7
function minorChordWithRoot(event) {
Trace('- min chord');
  var notes = [
    event,
    minorThirdIntervalFrom(event),
    perfectFifthIntervalFrom(event),
    minorSeventhIntervalFrom(event)
  ];
  
  notes.push(octaveAbove(event));
  return notes;
}

// halfDim7
function halfDiminishedChordWithRoot(event) {
Trace('- half dim chord');
  var notes = [
    event,
    minorThirdIntervalFrom(event),
    diminishedFifthIntervalFrom(event),
    minorSeventhIntervalFrom(event)
  ];
  
  notes.push(octaveAbove(event));
  return notes;
}

// fullDim7
function fullDiminishedChordWithRoot(event) {
Trace('- full dim chord');
  var notes = [
    event,
    minorThirdIntervalFrom(event),
    diminishedFifthIntervalFrom(event),
    majorSixthIntervalFrom(event)
  ];
  
  notes.push(octaveAbove(event));
  return notes;
}

// Dom7
function dominantChordWithRoot(event){
Trace('- dom chord');
	var notes = [
		event,
		majorThirdIntervalFrom(event),
		perfectFifthIntervalFrom(event),
		minorSeventhIntervalFrom(event)
	];
	
	notes.push(octaveAbove(event));
	return notes;
}

// minMaj7
function minMajChordWithRoot(event){
Trace('- minmaj chord');
	var notes = [
		event,
		minorThirdIntervalFrom(event),
		perfectFifthIntervalFrom(event),
		majorSeventhIntervalFrom(event)
	];
	
	notes.push(octaveAbove(event));
	return notes;
}

// augMaj7
function augMajorChordWithRoot(event){
	Trace('- aug maj chord');
	var notes = [
		event,
		majorThirdIntervalFrom(event),
		augmentedFifthIntervalFrom(event),
		majorSeventhIntervalFrom(event)
	];
	
	notes.push(octaveAbove(event));
	return notes;
}


// Diatonic Function Lookup

function pitchIsInSetOf(event, pitches){
	return pitches.indexOf(semitoneDifferenceFromRoot(event.pitch)) >= 0;
}


// KEY: 
// M - major
// m - minor
// D - dominant
// h - halfDiminished
// A - augMajor
// F - fullDiminished
// mM - minorMajor

// MAJOR
// --       QUALITY:  M     m     m  M     D     m     h
// -- SCALE DEGREES:  1     2     3  4     5     6     7
// -- REL SEMITONES:  0  1  2  3  4  5  6  7  8  9  10 11 12
// NATURAL MINOR
// --       QUALITY:  m     h  M     m     m  M     D
// -- SCALE DEGREES:  1     2  3     4     5  6     7
// -- REL SEMITONES:  0  1  2  3  4  5  6  7  8  9  10 11 12
// HARMONIC MINOR
// --       QUALITY:  mM    h  A     m     D  M        F
// -- SCALE DEGREES:  1     2  3     4     5  6        7
// -- REL SEMITONES:  0  1  2  3  4  5  6  7  8  9  10 11 12
// MELODIC MINOR
// --       QUALITY:  mM    m  A     D     D     h     h
// -- SCALE DEGREES:  1     2  3     4     5     6     7
// -- REL SEMITONES:  0  1  2  3  4  5  6  7  8  9  10 11 12

// Use SEMITONES for arrays, not scale degrees.

function findChordforHarmonicMinor(event){
	 if (pitchIsInSetOf(event, [0])) {
    return minMajChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [2])) {
    return halfDiminishedChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [3])){
  		return augMajorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [5])){
  		return minorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [7])){
  		return dominantChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [8])){
  		return majorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [11])){
  		return fullDiminishedChordWithRoot(event);
  } else {
    return [event];
  }
}

function findChordforMajor(event){
	 if (pitchIsInSetOf(event, [0,5])) {
    return majorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [2,4,9])) {
    return minorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [7])){
  		return dominantChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [11])){
  		return halfDiminishedChordWithRoot(event);
  } else {
    return [event];
  }
}

function findChordforNaturalMinor(event){
	 if (pitchIsInSetOf(event, [3,8])) {
    return majorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [0,5,7])) {
    return minorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [10])){
  		return dominantChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [2])){
  		return halfDiminishedChordWithRoot(event);
  } else {
    return [event];
  }
}

function findChordforJazzMinor(event){
	 if (pitchIsInSetOf(event, [0])) {
    return minMajChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [2])) {
    return minorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [3])){
  		return augMajorChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [5,7])){
  		return dominantChordWithRoot(event);
  } else if (pitchIsInSetOf(event, [9,11])){
  		return halfDiminishedChordWithRoot(event);
  } else {
    return [event];
  }
}



// Chord Type Router

function chordForNote(event) {
	switch(keyQuality()){
		case 0:
			Trace('(find maj)');
			return findChordforMajor(event);
			break;
		case 1:
			Trace('(find nat minor)');
			return findChordforNaturalMinor(event);
			break;
		case 2:
		Trace('(find harm minor)');
			return findChordforHarmonicMinor(event);
			break;
		case 3:
			Trace('(find jazz minor)');
			return findChordforJazzMinor(event);
			break;
		default:
			Trace("oh shit");
			break;
	}
}

function HandleMIDI(event) {
  playChord(chordForNote(event));  
}