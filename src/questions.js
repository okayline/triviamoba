// TriviaMoba's questions and their answers. They live here in the Worker and never in public/: the page only ever gets
// a question and its options, and learns the right answer after it has answered (src/worker.js deal and answer).
// Sample questions for the prototype. Questions are only ever added, never edited or reordered, so a question's place in
// its list stays the same for everything the server has saved.

export const TIME = 15;   // seconds a player has to answer
export const GRACE = 5;   // extra seconds the server allows for lag: a pick that comes in after TIME + GRACE counts as too late

// correct answer first; the Worker shuffles the options it sends. A question can have a picture (img: a file in public/img/,
// named by a hash so the name never gives the answer away).
export const BANK = {
  def: [
    { q: "Which of the Seven Wonders of the Ancient World is still standing?", a: ["The Great Pyramid of Giza", "The Lighthouse of Alexandria", "The Colossus of Rhodes", "The Hanging Gardens of Babylon"] },
    { q: "The first email was sent in which decade?", a: ["The 1970s", "The 1950s", "The 1960s", "The 1980s"] },
    { q: "Which of these was invented first?", a: ["The fax machine", "The telephone", "The light bulb", "The radio"] },
    { q: "Teaching at Oxford University had already begun before which of these was founded?", a: ["The Aztec city of Tenochtitlan", "The Colosseum in Rome", "The city of London", "The Great Wall of China"] },
    { q: "In 1974, what was the first product scanned with a barcode at a supermarket checkout?", a: ["A pack of chewing gum", "A can of soup", "A loaf of bread", "A box of cereal"] }
  ],
  str: [
    { q: "Which bone in the human body isn't joined to any other bone?", a: ["The hyoid, in the throat", "The kneecap", "The tailbone", "The stirrup, in the ear"] },
    { q: "The Moon is slowly drifting away from Earth. About how far each year?", a: ["About 4 cm", "About 4 mm", "About 40 cm", "About 4 m"] },
    { q: "Which layer of Earth's atmosphere is the hottest?", a: ["The thermosphere", "The troposphere", "The stratosphere", "The mesosphere"] },
    { q: "About how long does light take to travel from the Moon to Earth?", a: ["About 1 second", "About 8 minutes", "About 1 minute", "It arrives instantly"] },
    { q: "Why do we always see the same side of the Moon?", a: ["Its spin is locked to its orbit", "It doesn't spin at all", "Earth's magnetism holds it still", "Sunlight only lights one side"] }
  ],
  int: [
    { q: "What does the S in HTTPS stand for?", a: ["Secure", "Server", "Standard", "Static"] },
    { q: "Which element has the chemical symbol W?", a: ["Tungsten", "Tin", "Zinc", "Vanadium"] },
    { q: "What number is 1111 in binary?", a: ["15", "11", "16", "4"] },
    { q: "At what temperature are Celsius and Fahrenheit the same?", a: ["−40°", "0°", "−32°", "100°"] },
    { q: "Which of these particles has no electric charge?", a: ["The neutron", "The proton", "The electron", "The positron"] },
    { q: "Which planet is this?", img: "img/2a6a3bad16.jpg", a: ["Earth","Mars","Neptune","Venus"] },
    { q: "Which planet is this?", img: "img/0180055b62.jpg", a: ["Jupiter","Saturn","Mars","Earth"] },
    { q: "Which planet is this?", img: "img/58ebd8de1c.jpg", a: ["Uranus","Neptune","Earth","Saturn"] },
    { q: "Which planet is this?", img: "img/ef141c32d3.jpg", a: ["Mars","Venus","Mercury","Jupiter"] },
    { q: "Which planet is this?", img: "img/8e1398cb43.jpg", a: ["Venus","Mars","Saturn","Uranus"] },
    { q: "Which planet is this?", img: "img/ce1989ecf7.jpg", a: ["Neptune","Uranus","Earth","Mercury"] },
    { q: "Which planet is this?", img: "img/f71aa93713.jpg", a: ["Saturn","Jupiter","Uranus","Venus"] },
    { q: "Which planet is this?", img: "img/1111db45e8.jpg", a: ["Mercury","Mars","Venus","Earth"] }
  ]
};
