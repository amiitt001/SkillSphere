import React from 'react';
import { render } from '@testing-library/react';
import CareerCard from '../CareerCard';
import { Recommendation } from '@/types';

// This is the main test block for the CareerCard component
describe('CareerCard Component', () => {

  // Create some sample data to pass to the component
  const mockRecommendation: Recommendation = {
    title: "Test Career",
    justification: "This is a test justification.",
    roadmap: ["Step 1", "Step 2"],
    estimatedSalary: "₹10,00,000 LPA",
    suggestedCertifications: ["Cert A", "Cert B"],
    keyCompanies: ["Company X", "Company Y"]
  };

  // This is our first test case
  it('renders correctly and matches snapshot', () => {
    // 1. "render" the component with our sample data
    const { asFragment } = render(<CareerCard {...mockRecommendation} />);
    
    // 2. Take a "snapshot" of the rendered HTML
    // The first time you run this, it will create a snapshot file.
    // Every time after, it will compare the component's output to that saved snapshot.
    expect(asFragment()).toMatchSnapshot();
  });

});
