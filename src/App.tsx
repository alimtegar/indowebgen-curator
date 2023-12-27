import { useState, ChangeEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";

type Data = {
  instruction: string,
  output: string,
  curationStatus: number,
  curationMessage: string,
  p: number,
};

function App() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams()
  const initDataIdx = +(searchParams.get('dataIdx') || '0');

  const [dataIdx, setDataIdx] = useState<number>(initDataIdx);
  const [numData, setNumData] = useState<number>(0);
  const [data, setData] = useState<Data>({
    instruction: '',
    output: '',
    curationStatus: 0,
    curationMessage: '',
    p: 1,
  });
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [upperSpace, setUpperSpace] = useState<boolean>(false);

  useEffect(() => {
    const savedData = localStorage.getItem('jsonData');
    if (savedData) {
      try {
        const parsedData: Data[] = JSON.parse(savedData);
        setData({
          ...parsedData[dataIdx],
          curationStatus: parsedData[dataIdx].curationStatus || 0,
          curationMessage: parsedData[dataIdx].curationMessage || '',
          p: parsedData[dataIdx].p || 1 / parsedData.length,
        });
        setNumData(parsedData.length)
      } catch (error) {
        console.error('Error parsing JSON data from local storage:', error);
      }
    }

    setSearchParams((searchParams: any) => {
      searchParams.set('dataIdx', dataIdx);
      return searchParams;
    });
  }, [dataIdx]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const parsedData = JSON.parse(e.target?.result as string);
          setData({
            ...parsedData[dataIdx],
            curationStatus: parsedData[dataIdx].curationStatus || 0,
            curationMessage: parsedData[dataIdx].curationMessage || '',
            p: parsedData[dataIdx].p || 1 / parsedData.length,
          });
          setNumData(parsedData.length)

          localStorage.setItem('jsonData', JSON.stringify(parsedData));
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }
      };

      reader.readAsText(file);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setIsChanged(true);
    setData({
      ...data,
      [e.currentTarget.name]: e.currentTarget.value
    });
  };

  const onNavigate = (_dataIdx: number) => {
    const prevOrNext = _dataIdx > dataIdx ? 'next' : 'previous';

    if (isChanged) {
      let nav_confirm = confirm(`Are you sure you want to go ${prevOrNext} without saving the changes?`)
      if (!nav_confirm) { alert('Navigate cancelled.'); return; }
    }

    setDataIdx(_dataIdx)
  };

  const saveData = (changeData: Data, next = false) => {
    // Load the saved data
    const savedData = localStorage.getItem('jsonData');
    if (!savedData) { alert('Data don\t exist in locall storage.'); return; }

    try {
      const parsedData = JSON.parse(savedData);

      // Replace the old data with the new data
      parsedData[dataIdx] = changeData;

      // Save the data
      localStorage.setItem('jsonData', JSON.stringify(parsedData));


      if (next) {
        onNavigate(dataIdx + 1);
      } else {
        navigate(0);
      }
    } catch (error) {
      console.error('Error parsing JSON data from local storage:', error);
    }
  };

  const onSave = (next = false) => {
    if (isChanged) {
      let saveConfirm = confirm('Are you sure you want to save the data?')
      if (!saveConfirm) { alert('Save cancelled.'); return; }
    }

    saveData({
      ...data,
      curationStatus: data.curationStatus === -1 ? -1 : 1,
    }, next);
    setIsChanged(false);
  };

  const onDelete = () => {
    let saveConfirm = confirm('Are you sure you want to delete the data?')
    if (!saveConfirm) { alert('Delete cancelled.'); return; }
    saveData({
      ...data,
      curationStatus: -1,
    });
  };

  const onRecover = () => {
    saveData({
      ...data,
      curationStatus: 0,
    });
  };

  const onExport = () => {
    // Load the saved data
    const savedData = localStorage.getItem('jsonData');
    if (!savedData) { alert('Data don\t exist in locall storage.'); return; }

    try {
      const parsedData = JSON.parse(savedData);

      const jsonData = JSON.stringify(parsedData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset-curated-${+(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error parsing JSON data from local storage:', error);
    }
  };

  return (
    <>
      {!(data.instruction && data.output) ? (
        <>
          Upload dataset:  <input type="file" className="file-input w-full" onChange={handleFileChange} />
        </>
      ) : (
        <>
          <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 5px',
            marginBottom: 5,
            marginTop: upperSpace ? 100 : 5,
          }}>
            <button type="button" onClick={() => onNavigate(dataIdx - 1)} disabled={dataIdx === 0}>Prev</button>
            <div>
              <span style={{ marginRight: 10 }}>
                <button type="button" onClick={onExport}>Export</button>
              </span>
              <span style={{ marginRight: 10 }}>
                Data Index: <input
                  type="number"
                  min={0}
                  value={dataIdx}
                  onChange={(e) => onNavigate(+e.currentTarget.value)}
                  style={{ width: 60 }}
                />
              </span>
              <span style={{ marginRight: 10 }}>
                Curation Status: {data.curationStatus == -1 ? (
                  <strong style={{ color: 'red' }}>DELETED</strong>
                ) : (
                  <input
                    type="number"
                    name="curationStatus"
                    value={data.curationStatus}
                    onChange={onInputChange}
                    style={{
                      width: 60,
                      backgroundColor: data.curationStatus === 1 ? 'rgba(0, 255, 0, 0.33)' : 'unset',
                    }}
                  />
                )}
              </span>
              <span style={{ marginRight: 10 }}>
                Curation Message: <input
                  type="text"
                  name="curationMessage"
                  value={data.curationMessage}
                  onChange={onInputChange}
                  style={{
                    width: 200,
                    backgroundColor: data.curationMessage && data.curationStatus === -1 ? 'rgba(255, 0, 0, 0.33)' : 'unset'
                  }}
                />
              </span>
              <span>
                p: <input
                  type="text"
                  name="p"
                  value={data.p}
                  onChange={onInputChange}
                  style={{ width: 100 }}
                />
              </span>
            </div>

            <button type="button" onClick={() => onNavigate(dataIdx + 1)} disabled={dataIdx >= (numData - 1)}>
              Next
            </button>
          </nav>

          <div style={{
            padding: '0 5px',
          }}>
            <textarea
              name="instruction"
              rows={2}
              onChange={onInputChange}
              style={{ width: 'calc(100vw - (4px * 2) - 58px)' }}
              value={data.instruction}
            />
            <textarea
              name="output"
              rows={8}
              onChange={onInputChange}
              style={{ width: 'calc(100vw - (4px * 2) - 58px)' }}
              value={data.output}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 5px',
            marginBottom: 5,
          }}>
            {data.curationStatus === -1 ? (
              <button type="button" onClick={onRecover}>Recover</button>
            ) : (<button
              type="button"
              onClick={onDelete}
              style={{
                marginRight: 5,
                backgroundColor: 'red',
                color: 'white',
              }}
            >
              Delete
            </button>)}
            <button type="button" onClick={() => setUpperSpace(!upperSpace)}>
              {upperSpace ? '⬆️' : '⬇️'}
            </button>
            <div>
              <button
                type="button"
                onClick={() => onSave(true)}
                style={{
                  marginRight: 5
                }}
              >
                Save and Next
              </button>
              <button
                type="button"
                onClick={() => onSave(false)}
                style={{
                  backgroundColor: 'green',
                  color: 'white',
                }}
              >
                Save
              </button>
            </div>
          </div>

          <hr style={{ margin: 0 }} />

          <div style={{ position: 'relative' }} dangerouslySetInnerHTML={{ __html: data.output }} />
        </>
      )}
    </>
  )
}

export default App
