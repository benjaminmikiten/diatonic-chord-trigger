var debug = true;
var parentKeys = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];
var qualities = ["Major", "Natural Minor", "Harmonic Minor", "Jazz Minor"];
var voicings = ["1-7/3-5-7", "1-5/1-3-5-7"];

var PluginParameters = [
  {name: "Parent Key", type: "menu", valueStrings: parentKeys, defaultValue: 0},
  {name: "Quality", type: "menu", valueStrings: qualities, defaultValue: 0},
  {name: "Voicing", type: "menu", valueStrings: voicings, defaultValue: 0}
];

function rootKey(){
  return GetParameter("Parent Key");
}

function getVoicing(){
  var lh = voicings[GetParameter("Voicing")].split('/')[0].split("-");
  var rh = voicings[GetParameter("Voicing")].split('/')[1].split("-");
  var voicing = {
    'left' : lh,
    'right' : rh
  }
  return voicing;
}

function scaleQuality(){
  return qualities[GetParameter("Quality")];
}

function playChord(events){
  events.map(function(event){
    event.send();
  });
}

function log(msg, val){
  if(debug){
    var m = msg + " : " + val;
    Trace(m);
  }
}

// Interval Transformation

function semitoneDifferenceFromRoot(pitch) {
  var semitones = (pitch - rootKey()) % 12;
  return semitones;
}

function semitonesByInterval(interval){
  return ["unison", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7", "octave"].indexOf(interval);
}

function transformByInterval(input, event){
  // separate "m3 above"

  var direction, interval;
  if(input.split(" ").length == 2){
    direction = input.split(" ")[1]; // "above" or "below"
    interval = input.split(" ")[0]; // some interval
  } else {
    interval = input;
    direction = "above";
  }

  var semitones = direction == "below" ? semitonesByInterval(interval) * -1 : semitonesByInterval(interval);
 
  var note = new event.constructor();
  note.pitch = event.pitch + semitones;
  note.velocity = event.velocity;
  return note; 
}

// Chord Factories

var ChordLibrary = {
  "major" : ["M3", "P5", "M7"],
  "minor" : ["m3", "P5", "m7"],
  "dominant" : ["M3", "P5", "m7"],
  "halfDiminished" : ["m3", "TT", "m7"],
  "fullDiminished" : ["m3", "TT", "M6"],
  "augmentedMajor" : ["M3", "M6", "M7"],
  "augmentedMinor" : ["m3", "TT", "m7"],
  "minorMajor" : ["m3", "P5", "M7"],
  "augmentedDominant" : ["M3", "TT", "m7"],
  "diminishedMajor" : ["m3", "TT", "M7"],
}

function buildChord(intervals, event){
  var chord = intervals.map(function(interval){
    return transformByInterval(interval, event);
  });
  return chord;
}

function transformVoicing(voicing, intervals){
  var hand = voicing.map(function(voicing){
    switch(voicing){
      case "1":
        return "unison"
        break;
      case "3":
        return intervals[0];
        break;
      case "5":
        return intervals[1];
        break;
      case "7":
        return intervals[2];
        break;
      default:
        return "unison"
        break;
    };
  });
  return hand;
}

function buildVoicing(chordType, event){
  var voicingPattern = getVoicing();
  var intervals = ChordLibrary[chordType];
  var rightHandIntervals = transformVoicing(voicingPattern.right, intervals);
  var leftHandIntervals = transformVoicing(voicingPattern.left, intervals);
  var rightChord = buildChord(rightHandIntervals, event);
  var leftChord = buildChord(leftHandIntervals, event);
  
  leftChord = leftChord.map(function(note){
    return transformByInterval('octave below', note);
  });

  var voicing = leftChord.concat(rightChord);
  return voicing;
}



// Diatonic Function Lookup

var Scales = {
'Harmonic Minor' : {
  0 : "minorMajor",
  2 : "halfDiminished",
  3 : "augmentedMajor",
  5 : "minor",
  7 : "dominant",
  8 : "major",
  11 : "fullDiminished" 
},
'Major' : {
  0 : "major",
  2 : 'minor',
  4 : 'minor',
  5 : 'major',
  7 : 'dominant',
  9 : 'minor',
  11 : 'halfDiminished'
},
'Natural Minor' : {
  0 : 'minor',
  2 : 'halfDiminished',
  3 : 'major',
  5 : 'minor',
  7 : 'minor',
  8 : 'major',
  10 : 'dominant'
},
'Jazz Minor' : {
  0 : 'minorMajor',
  2 : 'minor',
  3 : 'augmentedMajor',
  5 : 'dominant',
  7 : 'dominant',
  9 : 'halfDiminished',
  11 : 'halfDiminished'
}};


// Chord Type Router

function chordForNote(event) {
  var scaleType = scaleQuality();
  log('event', event);
  var absPitch = event.pitch;
  var relativePitch = semitoneDifferenceFromRoot(absPitch);
  var chordType = Scales[scaleType][relativePitch];
  if(chordType){
    return buildVoicing(chordType, event);
  } else {
    Trace("Not a diatonic chord");
    return [event];
  }
}

// Main Function
function copyNote(event){
  var copy = new event.constructor();
  copy.pitch = event.pitch;
  copy.velocity = event.velocity;
  return copy;
}
function HandleMIDI(event){
  playChord(chordForNote(event));
}