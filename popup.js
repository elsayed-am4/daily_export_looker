document.getElementById("cleanButton").addEventListener("click", function() {
  const inputText = document.getElementById("inputText").value;
  const cleanedText = cleanText(inputText);
  document.getElementById("result").textContent = cleanedText;
});

document.getElementById("copyButton").addEventListener("click", function() {
  const resultText = document.getElementById("result").textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    showTemporaryMessage("Copied to clipboard!");
  }).catch(err => {
    console.error("Failed to copy:", err);
  });
});

document.getElementById("titleCaseButton").addEventListener("click", function() {
  const inputText = document.getElementById("inputText").value;
  const titleCasedText = toTitleCase(inputText);
  document.getElementById("result").textContent = titleCasedText;
});

document.getElementById("sentenceCaseButton").addEventListener("click", function() {
  const inputText = document.getElementById("inputText").value;
  const sentenceCasedText = toSentenceCase(inputText);
  document.getElementById("result").textContent = sentenceCasedText;
});

function cleanText(inputText) {
  inputText = inputText.toLowerCase();
  const specialChars = " ×+:/\\*?™\"®<>|&@#-()[]{}!%'$,._`^~";
  for (let char of specialChars) {
    inputText = inputText.split(char).join("-");
  }
  inputText = inputText.replace(/-+$/, "");
  inputText = inputText.replace(/--+/g, "-");
  return inputText;
}

function toTitleCase(text) {
  return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
}

function toSentenceCase(text) {
  // Convert text to lowercase and capitalize the first letter of each sentence
  return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (letter) => letter.toUpperCase());
}

function showTemporaryMessage(message) {
  const messageStrip = document.createElement("div");
  messageStrip.textContent = message;
  messageStrip.style.position = "absolute";
  messageStrip.style.top = "0";
  messageStrip.style.left = "0";
  messageStrip.style.right = "0";
  messageStrip.style.backgroundColor = "#086d0c";
  messageStrip.style.color = "white";
  messageStrip.style.padding = "10px";
  messageStrip.style.textAlign = "center";
  messageStrip.style.fontSize = "14px";
  messageStrip.style.zIndex = "9999";

  document.body.appendChild(messageStrip);
  setTimeout(() => {
    messageStrip.remove();
  }, 2000);
}
// Tab switching logic
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

    this.classList.add("active");
    document.getElementById(this.getAttribute("data-tab")).classList.add("active");
  });
});

// CSV conversion logic
document.getElementById("convertButton").addEventListener("click", function () {
  const input = document.getElementById("inputData").value;

  if (input.includes(",")) {
    // Convert CSV to column
    const columnData = input.split(",").map(item => item.trim()).join("\n");
    document.getElementById("outputData").value = columnData;
  } else {
    // Convert column to CSV
    const csvData = input.split("\n").map(row => row.trim()).filter(row => row).join(",");
    document.getElementById("outputData").value = csvData;
  }
});

// Copy output to clipboard
document.getElementById("copyOutputButton").addEventListener("click", function () {
  const output = document.getElementById("outputData").value;

  navigator.clipboard.writeText(output).then(() => {
    showTemporaryMessage("Copied to clipboard!");
  }).catch(err => {
    console.error("Failed to copy:", err);
  });
});


// Color Palette Logic
document.getElementById('colorPalette').addEventListener('input', function () {
  const selectedColor = this.value;
  document.getElementById('colorCode').textContent = `${selectedColor}`;
});

// Color Picker Logic (EyeDropper)
document.getElementById('pickColorButton').addEventListener('click', async function () {
  try {
    const eyeDropper = new EyeDropper();
    const colorSelection = await eyeDropper.open();
    document.getElementById('colorCode').textContent = `${colorSelection.sRGBHex}`;

    // Update color palette to match the picked color
    document.getElementById('colorPalette').value = colorSelection.sRGBHex;
  } catch (err) {
    console.error('Color picking failed:', err);
  }
});

// Copy color to clipboard
document.getElementById("copyhexButton").addEventListener("click", function () {
  const output = document.getElementById("colorCode").textContent;

  navigator.clipboard.writeText(output).then(() => {
    showTemporaryMessage("Copied to clipboard!");
  }).catch(err => {
    console.error("Failed to copy:", err);
  });
});



// ===================================================================
//                     spelling and grammer checker
// ===================================================================

// Function to check grammar, spelling, and punctuation
async function checkGrammar() {
  const inputText = document.getElementById("spellInput").value;
  const resultContainer = document.getElementById("spellResult");
  const outputTextarea = document.getElementById("spellOutput");

  if (!inputText.trim()) {
      resultContainer.innerHTML = "<p class='error'>Please enter some text.</p>";
      outputTextarea.value = "";
      return;
  }

  try {
      const response = await fetch("https://api.languagetool.org/v2/check", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `text=${encodeURIComponent(inputText)}&language=en-US`
      });

      const data = await response.json();
      if (!data.matches || data.matches.length === 0) {
          resultContainer.innerHTML = "<p class='success'>No grammar, spelling, or punctuation issues found!</p>";
          outputTextarea.value = inputText;
      } else {
          let correctedText = inputText;
          let issues = [];

          // Apply corrections from last to first to prevent index shifts
          data.matches.sort((a, b) => b.offset - a.offset).forEach(match => {
              if (match.replacements.length > 0) {
                  let incorrectText = correctedText.substring(match.offset, match.offset + match.length);
                  let replacement = match.replacements[0].value;

                  // Apply correction
                  correctedText = correctedText.substring(0, match.offset) + replacement + correctedText.substring(match.offset + match.length);

                  // Store issue details
                  issues.push(`"${incorrectText}" → "${replacement}"`);
              }
          });

          // Second pass to check if more corrections are needed
          const secondResponse = await fetch("https://api.languagetool.org/v2/check", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `text=${encodeURIComponent(correctedText)}&language=en-US`
          });

          const secondData = await secondResponse.json();
          if (secondData.matches.length > 0) {
              // Recursive recheck for any remaining errors
              return checkGrammarWithText(correctedText, resultContainer, outputTextarea);
          }

          // Output results
          outputTextarea.value = correctedText;
          resultContainer.innerHTML = `<p class='warning'><strong>Issues Fixed:</strong> ${issues.join(", ")}</p>`;
      }
  } catch (error) {
      resultContainer.innerHTML = "<p class='error'>Error checking grammar and punctuation. Please try again.</p>";
      outputTextarea.value = "";
      console.error("Grammar check failed:", error);
  }
}

// Function to recheck corrected text
async function checkGrammarWithText(text, resultContainer, outputTextarea) {
  try {
      const response = await fetch("https://api.languagetool.org/v2/check", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `text=${encodeURIComponent(text)}&language=en-US`
      });

      const data = await response.json();
      if (!data.matches || data.matches.length === 0) {
          outputTextarea.value = text;
      } else {
          let correctedText = text;
          let issues = [];

          // Apply corrections again
          data.matches.sort((a, b) => b.offset - a.offset).forEach(match => {
              if (match.replacements.length > 0) {
                  let incorrectText = correctedText.substring(match.offset, match.offset + match.length);
                  let replacement = match.replacements[0].value;

                  // Apply correction
                  correctedText = correctedText.substring(0, match.offset) + replacement + correctedText.substring(match.offset + match.length);

                  // Store issue details
                  issues.push(`"${incorrectText}" >> "${replacement}"`);
              }
          });

          outputTextarea.value = correctedText;
          resultContainer.innerHTML = `<p class='warning'><strong>Additional Issues Fixed:</strong> ${issues.join(", ")}</p>`;

          const translationResponse = await fetch(`https://www.apertium.org/apy/translate?q=${encodeURIComponent(correctedText)}&langpair=en|ar`);
          const translationData = await translationResponse.json();

          if (translationData.responseData && translationData.responseData.translatedText) {
              arabicOutputTextarea.value = translationData.responseData.translatedText;
          } else {
              arabicOutputTextarea.value = "Translation failed. Try again.";
          }
      }
  } catch (error) {
      resultContainer.innerHTML = "<p class='error'>Error checking grammar and punctuation. Please try again.</p>";
      console.error("Grammar check failed on recheck:", error);
  }
}

// Function to copy corrected text to clipboard
async function copyCorrectedText() {
  const outputTextarea = document.getElementById("spellOutput");

  try {
      await navigator.clipboard.writeText(outputTextarea.value);
       showTemporaryMessage("Corrected text copied to clipboard!");
  } catch (error) {
       showTemporaryMessage("Failed to copy text. Please try again.");
      console.error("Clipboard copy failed:", error);
  }
}

// Event listeners
// document.getElementById("checkGrammarButton").addEventListener("click", checkGrammar);
// document.getElementById("copySpellOutputButton").addEventListener("click", copyCorrectedText);



//---------------------------------------------------------------------


//
// ===================================================================
//                               Links
// ===================================================================

const linkTypes = {
  contentful: "https://app.contentful.com/spaces/ruxgy07sp6fy/environments/master/entries/",
  plp: "https://www.nahdionline.com/plp/",
  clp: "https://www.nahdionline.com/clp/",
  pdp: "https://www.nahdionline.com/pdp/"
};


const suffixInput = document.getElementById("urlSuffixInput");
const outputLinkBox = document.getElementById("outputLink");
const openLinkButton = document.getElementById("openLinkButton");
const copyLinkButton = document.getElementById("copyLinkButton");
const toggleInputs = document.querySelectorAll('.switch-container input');




toggleInputs.forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) {
      toggleInputs.forEach(otherInput => {
        if (otherInput !== input) {
          otherInput.checked = false;
        }
      });
      updateOutputLink(); // <-- Important to refresh the link
    }
  });
});


// Update link when suffix or type changes
function updateOutputLink() {
  const selectedToggle = document.querySelector('input[name="linkType"]:checked');

  const suffix = suffixInput.value.trim();
  if (!selectedToggle) {
    outputLinkBox.value = "";
    return;
  }
  const selectedType = selectedToggle.value;
  const base = linkTypes[selectedType];
  outputLinkBox.value = suffix ? base + suffix : "";
}

// React to suffix typing
suffixInput.addEventListener("input", updateOutputLink);

// Open link in new tab
openLinkButton.addEventListener("click", () => {
  const url = outputLinkBox.value;
  if (url) {
    window.open(url, "_blank");
  }
});

// Copy to clipboard
copyLinkButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(outputLinkBox.value);
    showTemporaryMessage("Copied to clipboard!");
  } catch (err) {
    alert("Failed to copy.");
    console.error("Failed to copy:", err);
  }
});
