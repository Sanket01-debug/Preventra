// src/app/components/Faqs.jsx (or wherever you have this component)

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Faqs() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {/* Question 1: Sensors */}
          <AccordionItem value="item-1">
            <AccordionTrigger>
              How do the sensor measurements (Heart Rate, Breath Rate, etc.) work?
            </AccordionTrigger>
            <AccordionContent>
              HealthGuard AI utilizes your device's built-in sensors like the camera (for heart rate/BP estimation) and microphone (for breath rate/voice analysis), or simulates data syncing (for steps). Please follow the on-screen instructions carefully for each measurement. Note that these are estimations or simulations for tracking and awareness, not medical-grade readings.
            </AccordionContent>
          </AccordionItem>

          {/* Question 2: Camera/Mic Privacy */}
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Is using my camera/microphone for analysis safe and private?
            </AccordionTrigger>
            <AccordionContent>
              We prioritize your privacy. Camera-based analysis like Heart Rate and Blood Pressure estimation are designed to process data directly within the browser where possible. Voice Analysis requires sending audio data securely to our backend for processing with AI (like Google Gemini) and is not stored long-term after analysis. We only request access when needed for a specific feature.
            </AccordionContent>
          </AccordionItem>

          {/* Question 3: AI Accuracy */}
          <AccordionItem value="item-3">
            <AccordionTrigger>
              How accurate are the AI analysis and recommendations?
            </AccordionTrigger>
            <AccordionContent>
              Our AI models leverage powerful technology (like Google Gemini) trained on broad datasets to provide insights based on your input and sensor data. However, the analysis, recommendations, and generated tasks are for informational and educational purposes only. They help raise awareness but are **not** a substitute for professional medical evaluation. Accuracy can vary based on input quality and individual differences.
            </AccordionContent>
          </AccordionItem>

          {/* Question 4: Data Usage */}
          <AccordionItem value="item-4">
            <AccordionTrigger>
              How is my health data (chats, scans, tasks) used within the app?
            </AccordionTrigger>
            <AccordionContent>
              Your chat history and generated health tasks are stored locally in your browser's `localStorage`. Sensor readings are typically processed temporarily for analysis or to generate tasks. Voice data is sent for analysis and not stored persistently. This data is used primarily to personalize your experience within the app, such as providing relevant chat responses, generating tasks in your list, and displaying information on your dashboard.
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </section>
  );
}