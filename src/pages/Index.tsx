import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileUpload } from "@/components/FileUpload";
import { DataTable } from "@/components/DataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, LogOut, User } from "lucide-react";
import axios from "axios";

interface ParsedData {
  headers: string[];
  rows: string[][];
}

const Index = () => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [statusUrl, setStatusUrl] = useState<string | null>(null);
  const [isJobCompleted, setIsJobCompleted] = useState(false);
  const [polling, setPolling] = useState(false);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  const [departmentCount, setDepartmentCount] = useState<number | null>(null);
  const navigate = useNavigate();

  const userFullName = localStorage.getItem("userFullName") || "User";

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setJobId(null);
    setDownloadLink(null);
    setStatusUrl(null);
    setIsJobCompleted(false);
    setPolling(false);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(
        `${baseUrl}/api/file/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = response.data;
      setJobId(data.jobId);
      setDownloadLink(data.downloadLink);
      setStatusUrl(data.statusUrl);
      setPolling(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while uploading the file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAndDisplayProcessedCSV = async (csvUrl: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(csvUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        responseType: "blob",
      });
      const text = await response.data.text();
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) {
        setError("The processed CSV file appears to be empty");
        return;
      }
      const headers = lines[0]
        .split(",")
        .map((header) => header.trim().replace(/"/g, ""));
      const departmentIdx = headers.findIndex((h) => h === "Department Name");
      const salesIdx = headers.findIndex((h) => h === "Total Number of Sales");
      if (departmentIdx === -1 || salesIdx === -1) {
        setError("Required columns not found in the processed CSV");
        return;
      }
      const filteredHeaders = [headers[departmentIdx], headers[salesIdx]];
      const rows = lines.slice(1).map((line) => {
        const cells = line
          .split(",")
          .map((cell) => cell.trim().replace(/"/g, ""));
        return [cells[departmentIdx], cells[salesIdx]];
      });
      setParsedData({ headers: filteredHeaders, rows });
    } catch (err) {
      setError("Failed to fetch or parse the processed CSV file");
    }
  };

  // Polling effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const pollStatus = async () => {
      if (!statusUrl || isJobCompleted) return;
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${baseUrl}${statusUrl}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = response.data;
        if (data.state === "completed" && data.result) {
          setIsJobCompleted(true);
          setPolling(false);
          clearInterval(interval);
          if (data.result) {
            setProcessingTimeMs(data.result.processingTimeMs);
            setDepartmentCount(data.result.departmentCount);
          }
          if (downloadLink) {
            const csvUrl = `${import.meta.env.VITE_API_BASE_URL.replace(
              /\/$/,
              ""
            )}${downloadLink}`;
            fetchAndDisplayProcessedCSV(csvUrl);
          }
        }
      } catch (err) {
        // Optionally handle polling error
      }
    };
    if (polling && statusUrl && !isJobCompleted) {
      interval = setInterval(pollStatus, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, statusUrl, isJobCompleted, downloadLink]);

  const handleReset = () => {
    setParsedData(null);
    setError(null);
    setIsJobCompleted(false);
    setJobId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userFullName");
    navigate("/login");
  };

  // Add a helper function to format processing time
  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(2)} s`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes.toFixed(2)} min`;
    const hours = minutes / 60;
    return `${hours.toFixed(2)} h`;
  };

  const fileName = downloadLink ? downloadLink.split("/").pop() : "file.csv";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with user info and logout */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Welcome, {userFullName}
              </h2>
              <p className="text-sm text-gray-600">
                Ready to parse your CSV files
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Main content */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <FileSpreadsheet className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CSV File Parser
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your CSV files and instantly parse them into a beautiful,
            interactive table format
          </p>
        </div>

        {!parsedData ? (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Upload className="h-6 w-6 text-blue-600" />
                  Upload CSV File
                </CardTitle>
                <CardDescription className="text-base">
                  Drag and drop your CSV file or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  isLoading={isLoading}
                  error={error}
                />
                {jobId && (
                  <div className="mt-6 text-center">
                    <Button
                      asChild
                      className="w-full"
                      disabled={!isJobCompleted}
                    >
                      <a
                        href={
                          downloadLink
                            ? `${import.meta.env.VITE_API_BASE_URL.replace(
                                /\/$/,
                                ""
                              )}${downloadLink}`
                            : "#"
                        }
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {isJobCompleted
                          ? "Download Processed CSV"
                          : "Processing..."}
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* <Database className="h-6 w-6 text-green-600" /> */}
                  <div>
                    <CardTitle className="text-2xl">Processed Result</CardTitle>
                    <CardDescription>
                      {isJobCompleted &&
                      processingTimeMs !== null &&
                      departmentCount !== null
                        ? `${departmentCount} departments processed in ${formatProcessingTime(
                            processingTimeMs
                          )}`
                        : "Processing summary will appear here."}
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload New File
                </button>
              </CardHeader>
              <CardContent>
                {isJobCompleted && parsedData && (
                  <div className="mt-6">
                    <DataTable data={parsedData} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
