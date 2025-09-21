/**
 * This is a unit test for the CareerCard component.
 * It uses Jest and React Testing Library with snapshot testing
 * to ensure the component renders correctly with all its props.
 */
import React from 'react';
import { render } from '@testing-library/react';
import CareerCard from '../CareerCard';
import { Recommendation } from '@/types';

// --- TEST SUITE ---
describe('CareerCard Component', () => {

  // Create a sample recommendation object to use as test data.
  const mockRecommendation: Recommendation = {
    title: "AI/Machine Learning Engineer",
    justification: "A great fit for your skills in Python and interest in AI.",
    roadmap: ["Learn TensorFlow", "Build a portfolio project"],
    estimatedSalary: "₹10,00,000 - ₹20,00,000 LPA",
    suggestedCertifications: ["Google Certified Professional Machine Learning Engineer"],
    keyCompanies: ["Google", "Microsoft"]
  };

  // This is a snapshot test. The first time it runs, it creates a "snapshot" file
  // that saves the HTML structure of the rendered component. On every subsequent run,
  // it compares the new output to the saved snapshot. If they don't match, the test fails.
  // This is a powerful way to prevent accidental UI regressions.
  it('renders correctly and matches the snapshot', () => {
    // Act: Render the component with all the required props.
    // We provide default values for the selection props as they are not the focus of this test.
    const { asFragment } = render(
      <CareerCard
        {...mockRecommendation}
        isSelected={false}
        onSelect={() => {}} // Provide a dummy function
      />
    );

    // Assert: Check if the rendered output matches the saved snapshot.
    expect(asFragment()).toMatchSnapshot();
  });
});
