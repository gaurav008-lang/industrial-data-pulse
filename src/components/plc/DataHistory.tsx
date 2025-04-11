
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCcw, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HistoryEntry {
  id: string;
  timestamp: string;
  register: number;
  value: boolean;
  source: 'plc' | 'cloud';
}

interface DataHistoryProps {
  data: HistoryEntry[];
  onRefresh: () => void;
}

const DataHistory: React.FC<DataHistoryProps> = ({ data, onRefresh }) => {
  const [filter, setFilter] = useState('');
  const [source, setSource] = useState('all');
  
  const filteredData = data.filter(item => {
    const matchesFilter = filter === '' || 
      item.timestamp.toLowerCase().includes(filter.toLowerCase()) || 
      item.register.toString(16).toLowerCase().includes(filter.toLowerCase());
    const matchesSource = source === 'all' || item.source === source;
    return matchesFilter && matchesSource;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ['ID', 'Timestamp', 'Register (Hex)', 'Value', 'Source'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.id,
        row.timestamp,
        `0x${row.register.toString(16).toUpperCase()}`,
        row.value ? 'ON' : 'OFF',
        row.source.toUpperCase()
      ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `plc-history-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Historical Data</CardTitle>
            <CardDescription>View and export historical PLC data</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by timestamp or register..."
              className="pl-8"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="plc">PLC Direct</SelectItem>
              <SelectItem value="cloud">Cloud</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Register</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.timestamp}</TableCell>
                    <TableCell>0x{entry.register.toString(16).toUpperCase().padStart(4, '0')}</TableCell>
                    <TableCell>{entry.value ? 'ON' : 'OFF'}</TableCell>
                    <TableCell className="capitalize">{entry.source}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-muted-foreground">No data available</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} records
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={handleExport}
          disabled={filteredData.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataHistory;
