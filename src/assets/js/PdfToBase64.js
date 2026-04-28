// Function to convert PDF file from URL to Base64 string
const pdfUrlToBase64 = async (pdfUrl) => {
    try {
      // Fetch the PDF file
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      
      // Create a new FileReader object
      const reader = new FileReader();
  
      // Read the file as DataURL
      reader.readAsDataURL(blob);
  
      // When the file is read
      return new Promise((resolve, reject) => {
        reader.onload = function() {
          // Get the Base64 string
          const base64String = reader.result;
          // Resolve the promise with the Base64 string
          resolve(base64String);
        };
  
        // If there's an error reading the file
        reader.onerror = function() {
          reject(reader.error);
        };
      });
    } catch (error) {
      // Handle errors
      console.error('Error fetching PDF:', error);
      throw error;
    }
  };
  
  export default pdfUrlToBase64;
  