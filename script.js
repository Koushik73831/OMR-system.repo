// Global variables
        let answerKey = {};
        let uploadedFiles = [];
        let evaluationResults = [];

        // Navigation
        function showSection(sectionId) {
            const sections = ['dashboard', 'answer-key', 'upload', 'results'];
            sections.forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            document.getElementById(sectionId).classList.remove('hidden');
        }

        // Answer Key Functions
        function generateQuestions() {
            const count = parseInt(document.getElementById('question-count').value);
            const container = document.getElementById('questions-grid');
            container.innerHTML = '';

            for (let i = 1; i <= count; i++) {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'form-group';
                questionDiv.innerHTML = `
                    <label class="label">Question ${i}</label>
                    <select class="select" name="q${i}">
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                `;
                container.appendChild(questionDiv);
            }
        }

        document.getElementById('answer-key-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const testName = document.getElementById('test-name').value;
            const questionCount = parseInt(document.getElementById('question-count').value);
            
            answerKey = {
                testName: testName,
                questions: {}
            };

            for (let i = 1; i <= questionCount; i++) {
                const answer = document.querySelector(`select[name="q${i}"]`).value;
                answerKey.questions[i] = answer;
            }

            alert('Answer key saved successfully!');
            showSection('dashboard');
        });

        // Upload Functions
        function handleFiles(files) {
            uploadedFiles = Array.from(files);
            const container = document.getElementById('files-container');
            const fileList = document.getElementById('file-list');
            
            container.innerHTML = '';
            
            uploadedFiles.forEach((file, index) => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'card';
                fileDiv.style.padding = '1rem';
                fileDiv.innerHTML = `
                    <strong>${file.name}</strong>
                    <span style="color: hsl(var(--muted-foreground)); margin-left: 1rem;">${(file.size / 1024).toFixed(1)} KB</span>
                `;
                container.appendChild(fileDiv);
            });
            
            fileList.classList.remove('hidden');
        }

        // Drag and drop functionality
        const uploadArea = document.getElementById('upload-area');
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });

        // Processing Functions
        function processSheets() {
            if (!answerKey.questions || Object.keys(answerKey.questions).length === 0) {
                alert('Please create an answer key first!');
                return;
            }

            const processing = document.getElementById('processing');
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            
            processing.classList.remove('hidden');
            
            // Simulate processing
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress > 100) progress = 100;
                
                progressBar.style.width = progress + '%';
                progressText.textContent = `Processing ${Math.floor(progress)}%...`;
                
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        generateMockResults();
                        processing.classList.add('hidden');
                        showSection('results');
                    }, 500);
                }
            }, 200);
        }

        function generateMockResults() {
            const questionCount = Object.keys(answerKey.questions).length;
            evaluationResults = [];

            uploadedFiles.forEach((file, index) => {
                const studentId = `STU${String(index + 1).padStart(3, '0')}`;
                const studentName = `Student ${index + 1}`;
                
                // Generate random score
                const correctAnswers = Math.floor(Math.random() * questionCount * 0.6) + Math.floor(questionCount * 0.2);
                const percentage = Math.round((correctAnswers / questionCount) * 100);
                
                let grade = 'F';
                if (percentage >= 90) grade = 'A';
                else if (percentage >= 80) grade = 'B';
                else if (percentage >= 70) grade = 'C';
                else if (percentage >= 60) grade = 'D';
                
                const status = percentage >= 60 ? 'Pass' : 'Fail';
                
                evaluationResults.push({
                    studentId,
                    studentName,
                    score: correctAnswers,
                    total: questionCount,
                    percentage,
                    grade,
                    status
                });
            });

            updateResultsDisplay();
            updateDashboardStats();
        }

        function updateResultsDisplay() {
            const tbody = document.getElementById('results-tbody');
            tbody.innerHTML = '';

            evaluationResults.forEach(result => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${result.studentId}</td>
                    <td>${result.studentName}</td>
                    <td>${result.score}/${result.total}</td>
                    <td>${result.percentage}%</td>
                    <td>${result.grade}</td>
                    <td style="color: ${result.status === 'Pass' ? 'hsl(var(--success))' : 'hsl(var(--warning))'}">
                        ${result.status}
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Update results stats
            const total = evaluationResults.length;
            const avgScore = Math.round(evaluationResults.reduce((sum, r) => sum + r.percentage, 0) / total);
            const highest = Math.max(...evaluationResults.map(r => r.percentage));
            const lowest = Math.min(...evaluationResults.map(r => r.percentage));

            document.getElementById('results-total').textContent = total;
            document.getElementById('results-avg').textContent = avgScore + '%';
            document.getElementById('results-highest').textContent = highest + '%';
            document.getElementById('results-lowest').textContent = lowest + '%';
        }

        function updateDashboardStats() {
            const total = evaluationResults.length;
            const avgScore = total > 0 ? Math.round(evaluationResults.reduce((sum, r) => sum + r.percentage, 0) / total) : 0;
            const completionRate = total > 0 ? Math.round((evaluationResults.filter(r => r.status === 'Pass').length / total) * 100) : 0;

            document.getElementById('total-sheets').textContent = total;
            document.getElementById('avg-score').textContent = avgScore + '%';
            document.getElementById('completion-rate').textContent = completionRate + '%';
        }

        function exportResults() {
            if (evaluationResults.length === 0) {
                alert('No results to export!');
                return;
            }

            const csvContent = [
                ['Student ID', 'Name', 'Score', 'Total', 'Percentage', 'Grade', 'Status'],
                ...evaluationResults.map(r => [
                    r.studentId,
                    r.studentName,
                    r.score,
                    r.total,
                    r.percentage + '%',
                    r.grade,
                    r.status
                ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'omr_results.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        // Initialize
        generateQuestions();