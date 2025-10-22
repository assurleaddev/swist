'use client';

import { useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl'; // Works with v6
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Helper function to parse text commands (no changes needed here)
const parseCommand = (command: string): { toolName: string; toolInput: any } => {
  const [toolName, ...args] = command.trim().split(/\s+/);
  let toolInput: any = {};

  switch (toolName) {
    case 'directions_tool':
      toolInput = {
        waypoints: args.map(arg => {
          const [lon, lat] = arg.split(',').map(Number);
          return { coordinates: [lon, lat] };
        }),
      };
      break;

    case 'isochrone_tool': {
      const [isoLon, isoLat] = args[0].split(',').map(Number);
      toolInput = {
        location: { longitude: isoLon, latitude: isoLat },
        contourMinutes: [parseInt(args[1], 10)],
      };
      break;
    }

    case 'reverse_geocode_tool': {
      const [revLon, revLat] = args[0].split(',').map(Number);
      toolInput = {
        location: { longitude: revLon, latitude: revLat },
      };
      break;
    }
      
    case 'search_and_geocode_tool':
      toolInput = { searchText: args.join(' ') };
      break;
      
    case 'category_search_tool':
      toolInput = { searchText: args[0] };
      if (args[1]) {
        const [catLon, catLat] = args[1].split(',').map(Number);
        toolInput.location = { longitude: catLon, latitude: catLat };
      }
      break;

    case 'version_tool':
    case 'category_list_tool':
      toolInput = {};
      break;

    default:
      try {
        toolInput = JSON.parse(args.join(' '));
      } catch (e) {
        console.error("Could not parse JSON input for tool:", toolName);
      }
      break;
  }
  return { toolName, toolInput };
};

export default function NewTestChat() {
  const [messages, setMessages] = useState<{ author: string; text: string; imageUrl?: string }[]>([]);
  const [input, setInput] = useState('');
  const [geojson, setGeojson] = useState<any>(null);
  
  // FIX 1: v6 uses a single 'viewport' state object.
  const [viewport, setViewport] = useState({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 12,
    width: '100%',
    height: '100%'
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { author: 'user', text: input }]);
    const command = input;
    setInput('');

    try {
      const { toolName, toolInput } = parseCommand(command);

      const response = await fetch('http://localhost:8000/mcp-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, input: toolInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setGeojson(data.output?.geoJson || null);

      const botMessage = { 
        author: 'bot', 
        text: JSON.stringify(data, null, 2),
        imageUrl: data.output?.imageUrl
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
      setMessages(prev => [...prev, { author: 'bot', text: error.message }]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
        <div style={{ flex: 1 }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '15px' }}>
              <strong style={{ textTransform: 'capitalize' }}>{msg.author}:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f5f5f5', padding: '10px', borderRadius: '5px', marginTop: '5px' }}>
                <code>{msg.text}</code>
              </pre>
              {msg.imageUrl && <img src={msg.imageUrl} alt="Static Map" style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '5px' }} />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', marginTop: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Enter tool command..."
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button onClick={sendMessage} style={{ padding: '10px 15px', marginLeft: '10px', cursor: 'pointer', border: 'none', background: '#007bff', color: 'white', borderRadius: '5px' }}>
            Send
          </button>
        </div>
      </div>
      <div style={{ flex: 2 }}>
        {/* FIX 2: Use v6 props for the Map component */}
        <Map
          {...viewport}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxApiAccessToken={MAPBOX_TOKEN}
          onViewportChange={(nextViewport: any) => setViewport(nextViewport)}
        >
          {geojson && (
            <Source id="data" type="geojson" data={geojson}>
              <Layer id="line-layer" type="line" paint={{ 'line-color': '#007cbf', 'line-width': 4 }} />
              <Layer id="fill-layer" type="fill" paint={{ 'fill-color': '#007cbf', 'fill-opacity': 0.5 }} />
              <Layer id="point-layer" type="circle" paint={{ 'circle-radius': 7, 'circle-color': '#B42222' }} />
            </Source>
          )}
        </Map>
      </div>
    </div>
  );
}