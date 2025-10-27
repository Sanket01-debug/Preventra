// ./components/TabsComp.js
import { Button } from "@/components/ui/button";
import { Radiation, Brain, Activity, ScanSearch, ScanFaceIcon, Eye, Scan, Heart } from "lucide-react"; // Added ScanSearch for CT
// ... other icon imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Define scan types for better management
const SCAN_TYPES = {
    FACE: 'Face',
    XRAY: 'X-ray',
    MRI: 'MRI',
    CT: 'CT',
    // Add other types here if needed
};

// Map scan types to API endpoints
const API_ENDPOINTS = {
    [SCAN_TYPES.FACE]: '/api/gemini-face',
    [SCAN_TYPES.XRAY]: '/api/gemini-xray',
    [SCAN_TYPES.MRI]: '/api/gemini-mri',
    [SCAN_TYPES.CT]: '/api/gemini-ct',
};

export default function TabsComp({ handleCameraClick, handleSensorClick }) {
    const [isScanUploadDialogOpen, setIsScanUploadDialogOpen] = useState(false);
    const [currentScanType, setCurrentScanType] = useState(null); // Track which scan type dialog is for
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const router = useRouter();

    // Generic function to open the upload dialog for a specific scan type
    const handleScanUploadClick = (scanType) => {
        setCurrentScanType(scanType); // Set the type (e.g., 'X-ray', 'MRI', 'Face')
        setUploadedImage(null);       // Reset previous image
        setIsAnalyzing(false);      // Reset analyzing state
        setIsScanUploadDialogOpen(true); // Open the dialog
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedImage(file);
        }
    };

    // Generic function to handle upload and analysis for ANY scan type
    const handleUploadAndAnalyzeScan = async () => {
        if (!uploadedImage || !currentScanType) {
            alert("Please upload an image and ensure scan type is set.");
            return;
        }

        const apiEndpoint = API_ENDPOINTS[currentScanType];
        if (!apiEndpoint) {
            alert(`Invalid scan type or API endpoint not configured for ${currentScanType}.`);
            return;
        }

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('image', uploadedImage);

        try {
            const response = await fetch(apiEndpoint, { // Use dynamic endpoint
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();

                if (data.analysis && data.imageData) {
                    // Store result data AND the type of scan performed
                    sessionStorage.setItem('analysisResult', data.analysis);
                    sessionStorage.setItem('analysisImage', data.imageData);
                    sessionStorage.setItem('analysisScanType', currentScanType); // Store the type

                    router.push('/analysis-result'); // Navigate to the results page
                } else {
                    console.error("API response missing analysis or imageData:", data);
                    alert("Failed to get complete analysis results.");
                }

            } else {
                console.error(`Error sending image for ${currentScanType} analysis:`, response.status, await response.text());
                alert(`Failed to analyze ${currentScanType} image. Status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error during ${currentScanType} upload and analysis:`, error);
            alert(`An error occurred during ${currentScanType} analysis.`);
        } finally {
            setIsAnalyzing(false);
            setIsScanUploadDialogOpen(false);
            // Optionally clear currentScanType after closing dialog if needed
            // setCurrentScanType(null);
        }
    };

    // Dynamic Dialog Title and Description
    const getDialogDetails = () => {
        switch (currentScanType) {
            case SCAN_TYPES.FACE:
                return { title: "Upload Face Image", description: "Please upload a clear image of your face for analysis." };
            case SCAN_TYPES.XRAY:
                return { title: "Upload X-ray Image", description: "Please upload your X-ray scan image." };
            case SCAN_TYPES.MRI:
                return { title: "Upload MRI Image", description: "Please upload your MRI scan image." };
            case SCAN_TYPES.CT:
                return { title: "Upload CT Scan Image", description: "Please upload your CT scan image." };
            default:
                return { title: "Upload Image", description: "Please upload the relevant image file." };
        }
    };
    const dialogDetails = getDialogDetails();


    return (
        <section className="container mx-auto px-4 py-12">
            <Tabs defaultValue="sensors" className="max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="sensors">Sensor-based Scanning</TabsTrigger>

                    <TabsTrigger value="reports">Scan-reports Analysis</TabsTrigger>
                </TabsList>

                {/* Sensor Content (no changes needed here) */}
                <TabsContent value="sensors">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  {[
                    { icon: Heart, label: "Heart Rate", description: "Monitor your heart rate in real-time" },
                  ].map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5"
                      onClick={() => handleSensorClick(item.label)}
                    >
                      <item.icon className="h-8 w-8" />
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground text-wrap">{item.description}</span>
                    </Button>
                  ))}

{[
                            { icon: ScanFaceIcon, label: "Checkup via Face", description: "Take photos for analysis" },
                        ].map((item, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5"
                                onClick={() => {
                                    if (item.label === "Checkup via Face") {
                                        handleScanUploadClick(SCAN_TYPES.FACE); // Use generic handler
                                    } else {
                                        handleCameraClick(item.label); // Keep specific handler for others if needed
                                    }
                                }}
                            >
                                <item.icon className="h-8 w-8" />
                                <span className="font-medium">{item.label}</span>
                                <span className="text-xs text-muted-foreground">{item.description}</span>
                            </Button>
                        ))}
                </div>
                    {/* ... existing sensor buttons ... */}
                </TabsContent>

                {/* Reports Content - Hook up new scan types */}
                <TabsContent value="reports">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { icon: Radiation, label: "X-ray Analysis", type: SCAN_TYPES.XRAY, description: "Analyze X-ray images" },
                            { icon: Brain, label: "MRI Analysis", type: SCAN_TYPES.MRI, description: "Detailed brain and body scans" },
                            { icon: ScanSearch, label: "CT Scan Analysis", type: SCAN_TYPES.CT, description: "Analyze CT scan images" }, // Added CT
                            // { icon: Activity, label: "ECG Scan", description: "Monitor heart activity" }, // ECG might need different handling (data, not image)
                        ].map((item, index) => (
                             // Only render button if it has a 'type' for image analysis
                             item.type ? (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5"
                                    onClick={() => handleScanUploadClick(item.type)} // Use generic handler with type
                                >
                                    <item.icon className="h-8 w-8" />
                                    <span className="font-medium">{item.label}</span>
                                    <span className="text-xs text-muted-foreground">{item.description}</span>
                                </Button>
                             ) : null // Or render a disabled button/placeholder for items like ECG
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Generic Scan Upload Dialog */}
            <Dialog open={isScanUploadDialogOpen} onOpenChange={setIsScanUploadDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{dialogDetails.title}</DialogTitle>
                        <DialogDescription>{dialogDetails.description}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input
                            id="scan-image-upload"
                            type="file"
                            accept="image/*" // Keep it generic, or refine if needed (e.g., DICOM might need specific handling)
                            onChange={handleImageChange}
                            disabled={isAnalyzing}
                        />
                        {uploadedImage && !isAnalyzing && (
                            <div className="mt-2 text-sm text-muted-foreground">
                                <p>Selected: {uploadedImage.name}</p>
                            </div>
                        )}
                        {isAnalyzing && (
                             <p className="text-sm text-primary flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Analyzing {currentScanType}...
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsScanUploadDialogOpen(false)}
                            disabled={isAnalyzing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUploadAndAnalyzeScan} // Use generic upload handler
                            disabled={!uploadedImage || isAnalyzing}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}