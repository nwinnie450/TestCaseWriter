const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx');
const TestCase = require('../models/TestCase');

class ImportExportService {
    constructor() {
        this.supportedFormats = ['csv', 'excel', 'json', 'testrail', 'jira', 'xml'];
    }
    
    // Import test cases from various sources
    async importTestCases(source, filePath, options = {}) {
        try {
            switch (source.toLowerCase()) {
                case 'csv':
                    return await this.importFromCSV(filePath, options);
                case 'excel':
                    return await this.importFromExcel(filePath, options);
                case 'json':
                    return await this.importFromJSON(filePath, options);
                case 'testrail':
                    return await this.importFromTestRail(filePath, options);
                case 'jira':
                    return await this.importFromJira(filePath, options);
                case 'xml':
                    return await this.importFromXML(filePath, options);
                default:
                    throw new Error(`Unsupported import format: ${source}`);
            }
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
    
    // Import from CSV
    async importFromCSV(filePath, options = {}) {
        return new Promise((resolve, reject) => {
            const testCases = [];
            const mapping = options.mapping || this.getDefaultCSVMapping();
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        const testCase = this.mapCSVRowToTestCase(row, mapping);
                        testCases.push(testCase);
                    } catch (error) {
                        console.warn(`Skipping invalid row: ${error.message}`);
                    }
                })
                .on('end', () => {
                    resolve({
                        success: true,
                        imported: testCases.length,
                        testCases: testCases,
                        format: 'CSV'
                    });
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }
    
    // Import from Excel
    async importFromExcel(filePath, options = {}) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = options.sheet || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            const testCases = [];
            const mapping = options.mapping || this.getDefaultExcelMapping();
            
            jsonData.forEach((row, index) => {
                try {
                    const testCase = this.mapExcelRowToTestCase(row, mapping);
                    testCases.push(testCase);
                } catch (error) {
                    console.warn(`Skipping row ${index + 2}: ${error.message}`);
                }
            });
            
            return {
                success: true,
                imported: testCases.length,
                testCases: testCases,
                format: 'Excel',
                sheet: sheetName
            };
        } catch (error) {
            throw new Error(`Excel import failed: ${error.message}`);
        }
    }
    
    // Import from JSON
    async importFromJSON(filePath, options = {}) {
        try {
            const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const testCases = [];
            
            if (Array.isArray(jsonData)) {
                jsonData.forEach((data, index) => {
                    try {
                        const testCase = new TestCase(data);
                        testCases.push(testCase);
                    } catch (error) {
                        console.warn(`Skipping test case ${index}: ${error.message}`);
                    }
                });
            } else if (jsonData.testCases && Array.isArray(jsonData.testCases)) {
                jsonData.testCases.forEach((data, index) => {
                    try {
                        const testCase = new TestCase(data);
                        testCases.push(testCase);
                    } catch (error) {
                        console.warn(`Skipping test case ${index}: ${error.message}`);
                    }
                });
            } else {
                // Single test case
                testCases.push(new TestCase(jsonData));
            }
            
            return {
                success: true,
                imported: testCases.length,
                testCases: testCases,
                format: 'JSON'
            };
        } catch (error) {
            throw new Error(`JSON import failed: ${error.message}`);
        }
    }
    
    // Import from TestRail format
    async importFromTestRail(filePath, options = {}) {
        try {
            const csvData = await this.importFromCSV(filePath, {
                mapping: this.getTestRailMapping()
            });
            
            return {
                ...csvData,
                format: 'TestRail'
            };
        } catch (error) {
            throw new Error(`TestRail import failed: ${error.message}`);
        }
    }
    
    // Export test cases to various formats
    async exportTestCases(testCases, format, outputPath, options = {}) {
        try {
            switch (format.toLowerCase()) {
                case 'csv':
                    return await this.exportToCSV(testCases, outputPath, options);
                case 'excel':
                    return await this.exportToExcel(testCases, outputPath, options);
                case 'json':
                    return await this.exportToJSON(testCases, outputPath, options);
                case 'xml':
                    return await this.exportToXML(testCases, outputPath, options);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            throw new Error(`Export failed: ${error.message}`);
        }
    }
    
    // Export to CSV
    async exportToCSV(testCases, outputPath, options = {}) {
        try {
            const csvWriter = createCsvWriter({
                path: outputPath,
                header: this.getCSVHeaders()
            });
            
            const records = testCases.map(tc => tc.toCSV());
            await csvWriter.writeRecords(records);
            
            return {
                success: true,
                exported: testCases.length,
                filePath: outputPath,
                format: 'CSV'
            };
        } catch (error) {
            throw new Error(`CSV export failed: ${error.message}`);
        }
    }
    
    // Export to Excel
    async exportToExcel(testCases, outputPath, options = {}) {
        try {
            const worksheetData = testCases.map(tc => tc.toCSV());
            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            
            const sheetName = options.sheetName || 'Test Cases';
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            
            // Add summary sheet if requested
            if (options.includeSummary) {
                const summaryData = this.generateSummaryData(testCases);
                const summarySheet = XLSX.utils.json_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
            }
            
            XLSX.writeFile(workbook, outputPath);
            
            return {
                success: true,
                exported: testCases.length,
                filePath: outputPath,
                format: 'Excel'
            };
        } catch (error) {
            throw new Error(`Excel export failed: ${error.message}`);
        }
    }
    
    // Export to JSON
    async exportToJSON(testCases, outputPath, options = {}) {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                totalTestCases: testCases.length,
                exportedBy: options.exportedBy || 'System',
                format: 'JSON',
                testCases: testCases.map(tc => tc.toJSON())
            };
            
            if (options.includeStats) {
                exportData.statistics = this.generateStatistics(testCases);
            }
            
            fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
            
            return {
                success: true,
                exported: testCases.length,
                filePath: outputPath,
                format: 'JSON'
            };
        } catch (error) {
            throw new Error(`JSON export failed: ${error.message}`);
        }
    }
    
    // Helper methods for mapping data
    getDefaultCSVMapping() {
        return {
            'Test Case ID': 'id',
            'Title': 'title',
            'Description': 'description',
            'Category': 'category',
            'Priority': 'priority',
            'Type': 'type',
            'Tags': 'tags',
            'Prerequisites': 'prerequisites',
            'Test Steps': 'steps',
            'Expected Result': 'expectedResult',
            'Estimated Time': 'estimatedTime',
            'Created By': 'createdBy'
        };
    }
    
    getDefaultExcelMapping() {
        return this.getDefaultCSVMapping();
    }
    
    getTestRailMapping() {
        return {
            'ID': 'id',
            'Title': 'title',
            'Section': 'category',
            'Priority': 'priority',
            'Type': 'type',
            'Preconditions': 'prerequisites',
            'Steps': 'steps',
            'Expected Result': 'expectedResult',
            'Estimate': 'estimatedTime'
        };
    }
    
    mapCSVRowToTestCase(row, mapping) {
        const testCaseData = {};
        
        // Map fields based on mapping configuration
        Object.keys(mapping).forEach(csvField => {
            const testCaseField = mapping[csvField];
            if (row[csvField] !== undefined) {
                testCaseData[testCaseField] = this.parseFieldValue(testCaseField, row[csvField]);
            }
        });
        
        return new TestCase(testCaseData);
    }
    
    mapExcelRowToTestCase(row, mapping) {
        return this.mapCSVRowToTestCase(row, mapping);
    }
    
    parseFieldValue(field, value) {
        if (!value || value.trim() === '') return '';
        
        switch (field) {
            case 'tags':
                return value.split(',').map(tag => tag.trim()).filter(tag => tag);
            case 'prerequisites':
                return value.split(';').map(req => req.trim()).filter(req => req);
            case 'steps':
                return this.parseStepsFromString(value);
            default:
                return value.toString().trim();
        }
    }
    
    parseStepsFromString(stepsString) {
        // Parse steps from string format like "1. Action | Expected: Result; 2. Action | Expected: Result"
        const steps = [];
        const stepParts = stepsString.split(';');
        
        stepParts.forEach((stepPart, index) => {
            const trimmed = stepPart.trim();
            if (trimmed) {
                const [actionPart, expectedPart] = trimmed.split('|');
                const action = actionPart ? actionPart.replace(/^\d+\.\s*/, '').trim() : '';
                const expected = expectedPart ? expectedPart.replace(/^Expected:\s*/, '').trim() : '';
                
                steps.push({
                    stepNumber: index + 1,
                    action,
                    expected,
                    actualResult: '',
                    status: ''
                });
            }
        });
        
        return steps;
    }
    
    getCSVHeaders() {
        return [
            { id: 'Test Case ID', title: 'Test Case ID' },
            { id: 'Title', title: 'Title' },
            { id: 'Description', title: 'Description' },
            { id: 'Category', title: 'Category' },
            { id: 'Priority', title: 'Priority' },
            { id: 'Type', title: 'Type' },
            { id: 'Tags', title: 'Tags' },
            { id: 'Prerequisites', title: 'Prerequisites' },
            { id: 'Test Steps', title: 'Test Steps' },
            { id: 'Expected Result', title: 'Expected Result' },
            { id: 'Estimated Time', title: 'Estimated Time' },
            { id: 'Current Status', title: 'Current Status' },
            { id: 'Jira Stories', title: 'Jira Stories' },
            { id: 'Created By', title: 'Created By' },
            { id: 'Created Date', title: 'Created Date' },
            { id: 'Last Modified', title: 'Last Modified' }
        ];
    }
    
    generateSummaryData(testCases) {
        const categories = {};
        const priorities = {};
        const statuses = {};
        
        testCases.forEach(tc => {
            categories[tc.category] = (categories[tc.category] || 0) + 1;
            priorities[tc.priority] = (priorities[tc.priority] || 0) + 1;
            statuses[tc.currentStatus] = (statuses[tc.currentStatus] || 0) + 1;
        });
        
        return [
            { Metric: 'Total Test Cases', Value: testCases.length },
            { Metric: 'Categories', Value: Object.keys(categories).length },
            { Metric: 'Most Common Category', Value: Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b) },
            { Metric: 'Critical/High Priority', Value: (priorities.Critical || 0) + (priorities.High || 0) },
            { Metric: 'Executed Tests', Value: testCases.filter(tc => tc.currentStatus !== 'Not_Executed').length },
            { Metric: 'Passed Tests', Value: statuses.Pass || 0 },
            { Metric: 'Failed Tests', Value: statuses.Fail || 0 },
            { Metric: 'Blocked Tests', Value: statuses.Blocked || 0 }
        ];
    }
    
    generateStatistics(testCases) {
        return {
            total: testCases.length,
            categories: this.groupBy(testCases, 'category'),
            priorities: this.groupBy(testCases, 'priority'),
            statuses: this.groupBy(testCases, 'currentStatus'),
            automation: {
                candidates: testCases.filter(tc => tc.automationCandidate).length,
                manual: testCases.filter(tc => tc.type === 'Manual').length,
                automated: testCases.filter(tc => tc.type === 'Automated').length
            }
        };
    }
    
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            groups[key] = (groups[key] || 0) + 1;
            return groups;
        }, {});
    }
    
    // Validate import file
    validateImportFile(filePath, format) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        const fileExtension = path.extname(filePath).toLowerCase();
        const validExtensions = {
            csv: ['.csv'],
            excel: ['.xlsx', '.xls'],
            json: ['.json'],
            xml: ['.xml']
        };
        
        if (validExtensions[format] && !validExtensions[format].includes(fileExtension)) {
            throw new Error(`Invalid file extension for ${format}. Expected: ${validExtensions[format].join(', ')}`);
        }
        
        return true;
    }
}

module.exports = ImportExportService;