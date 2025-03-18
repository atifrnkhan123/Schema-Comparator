    let comparisonData = null;

    function convertToSchema(jsonData) {
        try {
            const obj = JSON.parse(jsonData);
            const processValue = (value) => {
                const type = Array.isArray(value) ? 'array' : typeof value;
                const result = { type };
                if (type === 'object' && value !== null) {
                    result.properties = {};
                    result.required = Object.keys(value);
                    for (const [key, val] of Object.entries(value)) {
                        result.properties[key] = processValue(val);
                    }
                } else if (type === 'array' && value.length > 0) {
                    result.items = processValue(value[0]);
                } else if (type === 'string') {
                    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(value)) {
                        result.format = 'date-time';
                    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        result.format = 'email';
                    }
                }
                return result;
            };
            return processValue(obj);
        } catch (e) {
            console.error('Invalid JSON:', e);
            return null;
        }
    }

    function compareSchemas() {
        const checkValues = document.getElementById('checkValues').checked;
        const actualInput = document.getElementById('actual').value;
        const expectedInput = document.getElementById('expected').value;

        const actualSchema = convertToSchema(actualInput);
        const expectedSchema = convertToSchema(expectedInput);

        let actualData, expectedData;
        try {
            actualData = JSON.parse(actualInput);
            expectedData = JSON.parse(expectedInput);
        } catch (e) {
            alert('Invalid JSON input!');
            return;
        }

        const differences = [];
        const summary = {
            missing: [],
            caseMismatches: [],
            mismatches: [],
            extras: [],
            valueMismatches: []
        };

        const fieldSet = new Set();
        const fieldList = [];
        let totalFields = 0;

        function traverse(expectedObj, actualObj, path = '') {
            const expectedKeys = Object.keys(expectedObj);
            const actualKeys = Object.keys(actualObj || {});
            const expectedKeyMap = new Map(expectedKeys.map(k => [k.toLowerCase(), k]));
            const actualKeyMap = new Map(actualKeys.map(k => [k.toLowerCase(), k]));

            expectedKeys.forEach(expectedKey => {
                const expectedKeyLower = expectedKey.toLowerCase();
                const currentPath = path ? `${path}.${expectedKey}` : expectedKey;

                if (!fieldSet.has(currentPath)) {
                    fieldSet.add(currentPath);
                    fieldList.push(currentPath);
                    totalFields++;
                }

                if (!actualKeyMap.has(expectedKeyLower)) {
                    differences.push({
                        path: currentPath,
                        expected: expectedKey,
                        actual: 'MISSING',
                        status: 'Missing'
                    });
                    summary.missing.push(currentPath);
                } else {
                    const actualKey = actualKeyMap.get(expectedKeyLower);
                    if (actualKey !== expectedKey) {
                        differences.push({
                            path: currentPath,
                            expected: expectedKey,
                            actual: actualKey,
                            status: 'Case Mismatch'
                        });
                        summary.caseMismatches.push(currentPath);
                    }

                    const expectedVal = expectedObj[expectedKey];
                    const actualVal = actualObj[actualKey];

                    if (typeof expectedVal !== typeof actualVal) {
                        differences.push({
                            path: currentPath,
                            expected: typeof expectedVal,
                            actual: typeof actualVal,
                            status: 'Type Mismatch'
                        });
                        summary.mismatches.push(currentPath);
                    }

                    if (checkValues && typeof expectedVal !== 'object' && !Array.isArray(expectedVal)) {
                        if (expectedVal !== actualVal) {
                            differences.push({
                                path: currentPath,
                                expected: JSON.stringify(expectedVal),
                                actual: JSON.stringify(actualVal),
                                status: 'Value Mismatch'
                            });
                            summary.valueMismatches.push(currentPath);
                        }
                    }

                    if (typeof expectedVal === 'object' && expectedVal !== null) {
                        if (Array.isArray(expectedVal)) {
                            if (!Array.isArray(actualVal)) {
                                differences.push({
                                    path: currentPath,
                                    expected: 'Array',
                                    actual: typeof actualVal,
                                    status: 'Type Mismatch'
                                });
                                summary.mismatches.push(currentPath);
                            } else {
                                const maxLen = Math.max(expectedVal.length, actualVal.length);
                                for (let i = 0; i < maxLen; i++) {
                                    const elemPath = `${currentPath}[${i}]`;
                                    if (i >= actualVal.length) {
                                        differences.push({
                                            path: elemPath,
                                            expected: JSON.stringify(expectedVal[i]),
                                            actual: 'MISSING',
                                            status: 'Missing'
                                        });
                                        summary.missing.push(elemPath);
                                    } else if (i >= expectedVal.length) {
                                        differences.push({
                                            path: elemPath,
                                            expected: 'NOT EXPECTED',
                                            actual: JSON.stringify(actualVal[i]),
                                            status: 'Extra Field'
                                        });
                                        summary.extras.push(elemPath);
                                    } else {
                                        if (checkValues && typeof expectedVal[i] !== 'object' && !Array.isArray(expectedVal[i])) {
                                            if (expectedVal[i] !== actualVal[i]) {
                                                differences.push({
                                                    path: elemPath,
                                                    expected: JSON.stringify(expectedVal[i]),
                                                    actual: JSON.stringify(actualVal[i]),
                                                    status: 'Value Mismatch'
                                                });
                                                summary.valueMismatches.push(elemPath);
                                            }
                                        }
                                        traverse(expectedVal[i], actualVal[i], elemPath);
                                    }
                                }
                            }
                        } else {
                            traverse(expectedVal, actualVal, currentPath);
                        }
                    }
                }
            });

            actualKeys.forEach(actualKey => {
                const currentPath = path ? `${path}.${actualKey}` : actualKey;
                if (!expectedKeyMap.has(actualKey.toLowerCase())) {
                    differences.push({
                        path: currentPath,
                        expected: 'NOT EXPECTED',
                        actual: actualKey,
                        status: 'Extra Field'
                    });
                    summary.extras.push(currentPath);
                }
            });
        }

        traverse(expectedData, actualData);

        // Calculate match percentage
        const problematicPaths = new Set([
            ...summary.missing,
            ...summary.caseMismatches,
            ...summary.mismatches,
            ...summary.valueMismatches
        ]);
        const matchedCount = totalFields - problematicPaths.size;
        const percentage = totalFields === 0 ? 100 : (matchedCount / totalFields) * 100;
        const percentageColor = percentage === 100 ? 'var(--success)' :
                             percentage >= 80 ? 'var(--warning)' : 'var(--danger)';

        comparisonData = {
            metadata: {
                timestamp: new Date().toISOString(),
                compareValues: checkValues,
                actualSchema: actualSchema,
                expectedSchema: expectedSchema,
                matchPercentage: percentage.toFixed(2)
            },
            summary: summary,
            differences: differences,
            statistics: {
                totalFields: totalFields,
                matchedFields: matchedCount,
                fieldsCompared: fieldList,
                totalIssues: differences.length
            }
        };

        const resultsDiv = document.getElementById('results');
        const summaryDiv = document.getElementById('summary');
        const resultsBody = document.getElementById('resultsBody');
        const downloadBtnJSON = document.getElementById('downloadResultsJSON');
        const downloadBtnCSV = document.getElementById('downloadResultsCSV');
        const downloadBtnPDF = document.getElementById('downloadResultsPDF');


        const statisticsHTML = `
            <div class="summary-card statistics-card">
                <h3>Comparison Statistics</h3>
                <div><strong>Total Fields Compared:</strong> ${totalFields}</div>
                <div><strong>Schema Match:</strong>
                    <span class="status-percentage" style="color: ${percentageColor}">
                        ${percentage.toFixed(2)}%
                    </span>
                </div>
                <div><strong>Fields Compared:</strong>
                    <div class="field-list">
                        ${fieldList.map(f => `<div>• ${f}</div>`).join('')}
                    </div>
                </div>
                <div><strong>Total Issues Detected:</strong> ${differences.length}</div>
            </div>
        `;

        if (differences.length === 0) {
            summaryDiv.innerHTML = `
                ${statisticsHTML}
                <div class="summary-card success">
                    <h3>Schema Matched</h3>
                    <div>No issues found. The schemas are identical.</div>
                </div>
            `;
            resultsBody.innerHTML = '';
        } else {
            const summaryHTML = `
                ${statisticsHTML}
                <div class="summary-card missing">
                    <h3>Missing Fields (${summary.missing.length})</h3>
                    ${summary.missing.map(f => `<div>• ${f}</div>`).join('') || '<div>None</div>'}
                </div>
                <div class="summary-card case-mismatch">
                    <h3>Case Mismatches (${summary.caseMismatches.length})</h3>
                    ${summary.caseMismatches.map(f => `<div>• ${f}</div>`).join('') || '<div>None</div>'}
                </div>
                <div class="summary-card mismatch">
                    <h3>Type Mismatches (${summary.mismatches.length})</h3>
                    ${summary.mismatches.map(f => `<div>• ${f}</div>`).join('') || '<div>None</div>'}
                </div>
                <div class="summary-card extra">
                    <h3>Extra Fields (${summary.extras.length})</h3>
                    ${summary.extras.map(f => `<div>• ${f}</div>`).join('') || '<div>None</div>'}
                </div>
                ${checkValues ? `
                <div class="summary-card value-mismatch">
                    <h3>Value Mismatches (${summary.valueMismatches.length})</h3>
                    ${summary.valueMismatches.map(f => `<div>• ${f}</div>`).join('') || '<div>None</div>'}
                </div>
                ` : ''}
            `;
            summaryDiv.innerHTML = summaryHTML;
            resultsBody.innerHTML = differences.map(d => `
                <tr>
                    <td>${d.path}</td>
                    <td title="${d.expected}">${d.expected}</td>
                    <td title="${d.actual}">${d.actual}</td>
                    <td><span class="status-badge ${d.status.toLowerCase().replace(/ /g, '-')}">${d.status}</span></td>
                </tr>
            `).join('');
        }

        resultsDiv.style.display = 'block';
        downloadBtnJSON.style.display = 'inline-flex';
        downloadBtnCSV.style.display = 'inline-flex';
        downloadBtnPDF.style.display = 'inline-flex';


        function createDownloadButton(schema, containerId, fileName) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            if (!schema) return;
            const schemaJson = JSON.stringify(schema, null, 2);
            const blob = new Blob([schemaJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const btn = document.createElement('button');
            btn.className = 'download-btn';
            btn.innerHTML = '<i class="fas fa-download"></i> Download Schema';
            btn.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };
            container.appendChild(btn);
        }

        createDownloadButton(actualSchema, 'actualDownload', 'actual-schema.json');
        createDownloadButton(expectedSchema, 'expectedDownload', 'expected-schema.json');
    }

    function downloadComparisonResultsJSON() {
        if (!comparisonData) return;

        const dataStr = JSON.stringify(comparisonData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `schema-comparison-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadComparisonResultsCSV() {
        if (!comparisonData) return;

        let csvContent = "Field Path,Expected,Actual,Status\r\n"; // CSV header
        comparisonData.differences.forEach(item => {
            csvContent += `${item.path},"${item.expected}","${item.actual}",${item.status}\r\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schema-comparison-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadComparisonResultsPDF() {
        if (!comparisonData) return;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        pdf.setFontSize(20);
        pdf.text("Schema Comparison Results", 105, 20, { align: "center" });

        pdf.setFontSize(12);
        let y = 40;
        pdf.text(`Timestamp: ${comparisonData.metadata.timestamp}`, 20, y);
        y += 10;
        pdf.text(`Compare Values: ${comparisonData.metadata.compareValues}`, 20, y);
        y += 10;
        pdf.text(`Match Percentage: ${comparisonData.metadata.matchPercentage}%`, 20, y);
        y += 15;

        pdf.setFontSize(16);
        pdf.text("Detailed Differences:", 20, y);
        y += 10;

        pdf.setFontSize(10);

        if (comparisonData.differences.length === 0) {
            pdf.text("No differences found. Schemas are identical.", 20, y);
        } else {
            const headers = ["Field Path", "Expected", "Actual", "Status"];
            const rows = comparisonData.differences.map(diff => [
                diff.path, diff.expected, diff.actual, diff.status
            ]);

            pdf.table(20, y, rows, headers, { autoSize: false, columnStyles: { 0: { columnWidth: 70 } } }); // Adjust columnWidth as needed
        }


        pdf.save(`schema-comparison-${new Date().toISOString()}.pdf`);
    }
// Pretty Format Function
function prettyPrint(textareaId) {
    const textarea = document.getElementById(textareaId);
    try {
        // Parse existing content (whether formatted or not)
        const parsed = JSON.parse(textarea.value);

        // Format back to valid JSON (don't modify quotes/keys)
        textarea.value = JSON.stringify(parsed, null, 4);

        // Clear any error states
        textarea.classList.remove('error');
    } catch (error) {
        // Show temporary error indication
        textarea.classList.add('error');
        setTimeout(() => textarea.classList.remove('error'), 2000);
        alert('Invalid JSON: ' + error.message);
    }
}

// Add this notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Dark/Light Mode Toggle
function toggleTheme() {
    const body = document.body;
    const isDarkMode = body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
}

// Apply saved theme on page load
window.onload = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        document.getElementById("themeToggle").checked = true;
    }
};

    function resetFields() {
        document.getElementById('actual').value = '';
        document.getElementById('expected').value = '';
        document.getElementById('results').style.display = 'none';
        document.getElementById('summary').innerHTML = '';
        document.getElementById('resultsBody').innerHTML = '';
        document.getElementById('actualDownload').innerHTML = '';
        document.getElementById('expectedDownload').innerHTML = '';
        document.getElementById('checkValues').checked = false;
        document.getElementById('downloadResultsJSON').style.display = 'none';
        document.getElementById('downloadResultsCSV').style.display = 'none';
        document.getElementById('downloadResultsPDF').style.display = 'none';

        comparisonData = null;
    }
