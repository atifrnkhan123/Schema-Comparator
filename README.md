⚡️ Schema Comparator
Schema Comparator is a web-based tool designed to effortlessly compare JSON schemas and API responses, helping developers identify discrepancies between expected and actual data structures with precision.

🎯 Introduction
Schema Comparator provides an intuitive and user-friendly interface to analyze and compare JSON schemas or API responses. It automatically converts JSON data into schema definitions and highlights differences in structure, types, and optionally, values.

# ⚡️ Schema Comparator  

## 🚀 Features  
- 🔄 **JSON to Schema Conversion**: Automatically converts JSON input into schema definitions.  
- 🔎 **Schema Comparison**: Compares actual vs expected schemas efficiently.  
- 📊 **Value Comparison**: Optionally compares field values for added accuracy.  
- 📚 **Detailed Results**: Displays differences in a structured, easy-to-read table format.  
- 📥 **Export Options**: Download results in JSON, CSV, or PDF formats.  
- 🎨 **Pretty Print**: Beautify JSON input with a single click.  
- 🌗 **Dark/Light Mode**: Switch between light and dark themes.  
- 📱 **Responsive Design**: Works seamlessly on both desktop and mobile devices.  

## 🛠️ Problem It Solves  
- ✅ **API Validation**: Ensures API responses match expected schemas.  
- 🕵️‍♂️ **Debugging**: Quickly identifies structural and value mismatches.  
- 📖 **Documentation**: Helps maintain accurate API documentation.  
- 🧪 **Testing**: Enhances API testing and quality assurance workflows.  

## 🧩 Issues Resolved  
- 🔍 **Structural Differences**: Detects missing fields, extra fields, and type mismatches.  
- 🔡 **Case Sensitivity**: Identifies case mismatches in field names.  
- 📉 **Value Discrepancies**: Optional value comparison for primitive types.  
- ⏱️ **Time Consumption**: Automates manual schema comparison processes.  
- 📄 **Documentation Gaps**: Generates downloadable schema definitions to fill documentation gaps.  

## 🚦 Getting Started  

### ⚙️ Prerequisites  
- 🌐 **Modern web browser**  
- ✅ **No additional installations required**  

## 📚 Usage  
1. 📋 **Paste** your actual JSON response in the **"Actual Response"** textarea.  
2. 📝 **Paste** your expected JSON in the **"Expected Schema"** textarea.  
3. 🎨 **Click "Pretty Print"** to format JSON (optional).  
4. 🔎 **Check "Compare Values"** if you want to compare field values.  
5. 🔥 **Click "Compare Schemas"** to view results.  
6. 📥 **Download** results or generated schemas as needed.  

## 📊 Example  

### ✅ Actual Response  
```json
[
  {
    "name": "User_Status",
    "data": [
      {
        "listName": "User_Status",
        "sortOrder": 5,
        "translationKey": "User_Status.Active",
        "value": "Enabled",
        "text": "Account Enabled",
        "isDeprecated": false
      },
      {
        "listName": "User_Status",
        "sortOrder": 10,
        "translationKey": "User_Status.Disabled",
        "value": "Disabled",
        "text": "Account Disabled",
        "isDeprecated": true
      },
      {
        "listName": "User_Status",
        "sortOrder": 15,
        "translationKey": "User_Status.Suspended",
        "value": "Suspended",
        "text": "Account Suspended",
        "isDeprecated": false
      }
    ]
  }
]


