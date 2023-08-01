
import React, { useState } from 'react';
import axios from 'axios';
import './imageAnalyzer.css';

const backendURL = 'http://localhost:5000'; // Update this with the correct URL if needed

const ImageAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setImageUrl(URL.createObjectURL(selectedFile));
    setAnalysis(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select an image file first.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`${backendURL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysis(response.data.data);
    } catch (err) {
      console.error('Error uploading the image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="image-analyzer">
      <h1>Image Analyzer</h1>
      <div className="image-input">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {imageUrl && <img src={imageUrl} alt="Uploaded" />}
      </div>
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        analysis && (
          <div className="analysis-result">
            <h2>Analysis Result</h2>
            <div className="image-info">
              <p>
                Image Dimensions: {analysis.dimensions.width}x{analysis.dimensions.height}
              </p>
              <p>Dominant Colors:</p>
              <div className="color-boxes">
                {analysis.dominantColors.map((color, index) => (
                  <div key={index} className="color-box" style={{ backgroundColor: color }}></div>
                ))}
              </div>
            </div>
            {analysis.objectRecognition.length > 0 && (
              <div className="recognized-objects">
                <p>Recognized Objects:</p>
                <ul>
                  {analysis.objectRecognition.map((obj, index) => (
                    <li key={index}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      )}
      <button onClick={handleUpload}>Upload and Analyze</button>
    </div>
  );
};

export default ImageAnalyzer;
