'use client'
import { AddPoints, DeletePoints, EditPoints } from "@/server-actions/points";
import { PointsType } from "../interfaces";
import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faGear } from '@fortawesome/free-solid-svg-icons';

interface PointsResponse {
    success: boolean;
    message?: string;
    error?: string;
}

const blinkingStarClass = "animate-pulse text-amber-300 text-lg";



function MainScreen({ pointObjects = [] }: { pointObjects?: PointsType[] }) {
    // Debug log eltávolítása vagy módosítása
    // console.log("Initial pointObject:", pointObjects);

    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    //const [points, setPoints] = useState(pointObjects?.[0]?.points ?? 0);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [pointsToAdd, setPointsToAdd] = useState(0);
    const [isConsumingPoints, setIsConsumingPoints] = useState(false);
    const [consumedSeconds, setConsumedSeconds] = useState(0);
    const [secondsPerPoint, setSecondsPerPoint] = useState(60);
    const [secondsPerPointConsume, setSecondsPerPointConsume] = useState(60);
    const [selectedPointObject, setSelectedPointObject] = useState<PointsType | undefined>(
        pointObjects?.[0] || {
            _id: '',
            points: 0,
            childid: '',
            secondstoaccumulate: 60,
            secondstospend: 60,
            createdAt: '',
            updatedAt: ''
        }
    );

    const [localPointObjects, setLocalPointObjects] = useState<PointsType[]>(pointObjects);
    const lastPointAddedAt = useRef(0);
    const [newChildName, setNewChildName] = useState('');

    useEffect(() => {
        const initializePoints = async () => {
            if (!pointObjects || pointObjects.length === 0) {
                const newPointObject: PointsType = {
                    _id: '',
                    points: 0,
                    childid: 'Új gyerek',
                    secondstoaccumulate: 60,
                    secondstospend: 60,
                    createdAt: '',
                    updatedAt: ''
                };
                setLocalPointObjects([newPointObject]);
                setSelectedPointObject(newPointObject);
                updatePoints(newPointObject);
            }
        };

        initializePoints().catch(console.error);
    }, []);


    useEffect(() => {
        updatePoints(selectedPointObject);
    }, [selectedPointObject?.points, selectedPointObject?.secondstoaccumulate, selectedPointObject?.secondstospend, selectedPointObject?.childid]);
    // Points accumulation effect


    const updatePoints = async (pointObject: PointsType | undefined) => {
        if (!pointObject) return;

        pointObject.points = Math.round(pointObject.points);

        try {
            let response: PointsResponse;
            if (!pointObject._id || pointObject._id === '' || pointObject._id.startsWith('temp-')) {
                response = await AddPoints({
                    pointsId: '',
                    payload: {
                        points: pointObject.points,
                        childid: pointObject.childid || '',
                        secondstoaccumulate: pointObject.secondstoaccumulate || secondsPerPoint,
                        secondstospend: pointObject.secondstospend || secondsPerPointConsume
                    }
                });

                if (response.success && response.message && response.message !== 'Points added successfully') {
                    const newId = response.message;
                    setLocalPointObjects(prev =>
                        prev.map(obj =>
                            obj._id === pointObject._id ? { ...obj, _id: newId } : obj
                        )
                    );
                    setSelectedPointObject(prev =>
                        prev?._id === pointObject._id ? { ...prev, _id: newId } : prev
                    );
                }
            } else {
                response = await EditPoints({
                    pointsId: pointObject._id,
                    payload: {
                        points: pointObject.points,
                        childid: pointObject.childid,
                        secondstoaccumulate: pointObject.secondstoaccumulate || secondsPerPoint,
                        secondstospend: pointObject.secondstospend || secondsPerPointConsume
                    }
                });
            }

            if (!response.success) {
                console.error("Error:", response.error);
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error("Exception:", error.message);
            } else {
                console.error('An unknown error occurred');
            }
        }
    };

    const deletePointObject = async (pointObject: PointsType) => {
        await DeletePoints(pointObject._id);
        setLocalPointObjects(prevObjects => prevObjects.filter(obj => obj._id !== pointObject._id));
        setSelectedPointObject(pointObjects.length > 1 ? pointObjects[1] : undefined);
    };

    const startTimer = () => {
        if (!isRunning) {
            if (isConsumingPoints) {
                setTime((Number(selectedPointObject?.points || 0)) * (selectedPointObject?.secondstospend || 60));
                const id = setInterval(() => {
                    setTime((prevTime) => {
                        const newTime = prevTime - 1;
                        if (newTime <= 0) {
                            clearInterval(id);
                            setIsRunning(false);
                            setIntervalId(null);
                            return 0;
                        }


                        const secondsToSpend = Number(selectedPointObject?.secondstospend || 60);
                        console.log("secondsToSpend:", secondsToSpend);
                        console.log("newTime:", newTime);
                        console.log("newTime % secondsToSpend:", newTime % secondsToSpend);
                        if (newTime % secondsToSpend === 0 &&
                            newTime !== lastPointAddedAt.current) {
                            lastPointAddedAt.current = newTime;
                            setSelectedPointObject(prev => prev ? {
                                ...prev,
                                points: Math.max(0, prev.points - 1)
                            } : prev);
                        }
                        return newTime;
                    });
                    setConsumedSeconds(prev => prev + 1);
                }, 1000);
                setIntervalId(id);
            } else {
                const id = setInterval(() => {
                    setTime(prevTime => {
                        const newTime = prevTime + 1;

                        const secondsToAccumulate = Number(selectedPointObject?.secondstoaccumulate || 60);
                        if (newTime % secondsToAccumulate === 0 &&
                            newTime !== lastPointAddedAt.current) {
                            lastPointAddedAt.current = newTime;
                            setSelectedPointObject(prev => prev ? { ...prev, points: prev.points + 1 } : prev);
                        }
                        return newTime;
                    });
                }, 1000);
                setIntervalId(id);
            }
            setIsRunning(true);
        }
    };

    const pauseTimer = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
            setIsRunning(false);
        }
    };

    const stopTimer = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        setIsRunning(false);
        if (!isConsumingPoints) {
            setTime(0);
        }
    };

    const toggleMode = () => {
        if (!isRunning) {
            setIsConsumingPoints(!isConsumingPoints);
            setTime(0);
            setConsumedSeconds(0);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(Math.abs(Math.floor(seconds)) / 60);
        const remainingSeconds = Math.abs(Math.floor(seconds)) % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Calculate how many full and partial stars to show



    const handlePointsModification = async (amount: number) => {
        const newTotal = (Number(selectedPointObject?.points || 0)) + amount;
        if (newTotal >= 0) {

            setSelectedPointObject(prev => prev ? { ...prev, points: newTotal } : prev);

        }
    };

    const handlePinSubmit = () => {
        if (pin === '2455') {
            setIsPinVerified(true);
            setPin('');
        } else {
            alert('Helytelen PIN kód!');
            setPin('');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsPinVerified(false);
        setPin('');
        setPointsToAdd(0);
    };






    const handleAddPointObject = (value: string) => {
        const tempId = `temp-${Date.now()}`; // Ideiglenes egyedi azonosító
        const newPointObject: PointsType = {
            _id: tempId, // Az ideiglenes ID használata
            points: 0,
            childid: value,
            secondstoaccumulate: 60,
            secondstospend: 60,
            createdAt: '',
            updatedAt: ''
        };

        setLocalPointObjects(prev => [...prev, newPointObject]);
        setSelectedPointObject(newPointObject);
    };

    const handleChangePointObject = async (childId: string) => {
        if (!selectedPointObject) {
            console.error("No selected point object to update.");
            return;
        }

        // Először csak a lokális state-et frissítjük
        const updatedPointObject = {
            ...selectedPointObject,
            childid: childId
        };

        setLocalPointObjects(prevObjects =>
            prevObjects.map(obj =>
                obj._id === selectedPointObject._id ? updatedPointObject : obj
            )
        );
        setSelectedPointObject(updatedPointObject);
    };

    const handleDeletePointObject = () => {

        if (selectedPointObject) {
            deletePointObject(selectedPointObject);
        }

        setSelectedPointObject(pointObjects.length > 1 ? pointObjects[1] : undefined);
    };



    return (
        <div className="min-h-screen flex flex-col bg-gray-100 p-4" >

            <main className="flex-1 flex flex-col items-center" >

                <div className="bg-white p-8 rounded-lg shadow-lg text-center relative w-full max-w-md" >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                    >
                        <FontAwesomeIcon icon={faGear} className="text-xl" />
                    </button>
                    <label className="text-2xl font-bold text-black mb-8" >
                        {selectedPointObject?.childid}
                    </label>
                    < div className="text-4xl font-bold text-black mb-8" > {formatTime(time)} </div>

                    < div className="space-x-4 mb-4" >
                        <button
                            onClick={isRunning ? pauseTimer : startTimer}
                            className={`px-6 py-2 rounded-full text-white font-semibold ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                                }`
                            }
                        >
                            {isRunning ? 'Pause' : 'Start'}
                        </button>

                        < button
                            onClick={stopTimer}
                            className="px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold"
                        >
                            Stop
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-2 my-4">

                
                    <div
                        onClick={() => !isRunning && toggleMode()}
                        className={`relative w-14 h-7 rounded-full cursor-pointer transition-colors duration-300 ${isRunning ? 'opacity-50 cursor-not-allowed ' : ''
                            }${isConsumingPoints ? 'bg-purple-500' : 'bg-blue-500'
                            }`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${isConsumingPoints ? 'left-8' : 'left-1'
                            }`} />
                    </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 my-4">
                        <span className={`${!isConsumingPoints ? 'font-bold text-black' : 'text-gray-500'}`}>Pontgyűjtés</span>

                        <span className={`${isConsumingPoints ? 'font-bold text-black' : 'text-gray-500'}`}>Felhasználás</span>
                    </div>

                    < div className="mt-8 text-xl font-semibold text-black" >
                        Összes csillag: {selectedPointObject?.points.toFixed(0)}
                    </div>
                </div>

                < div className="w-full max-w-2xl mt-8 bg-white rounded-lg shadow-lg p-4" >



                    {!isRunning && (
                        <div className="grid grid-cols-8 gap-1 justify-items-center">
                            {[...Array(Math.floor(selectedPointObject?.points || 0))].map((_, i) => (
                                <FontAwesomeIcon key={i} icon={faStar} className="text-red-400 text-lg" />
                            ))}
                        </div>
                    )}

                    {!isConsumingPoints && isRunning && (
                        <div className="grid grid-cols-8 gap-1 justify-items-center">
                            {[...Array(Math.floor(selectedPointObject?.points || 0))].map((_, i) => (
                                <FontAwesomeIcon key={i} icon={faStar} className="text-red-400 text-lg" />
                            ))}

                            <FontAwesomeIcon icon={faStar} className={blinkingStarClass} />

                        </div>
                    )}

                    {isConsumingPoints && isRunning && (
                        <div className="grid grid-cols-8 gap-1 justify-items-center">
                            {[...Array(Math.floor(selectedPointObject?.points || 0) - 1)].map((_, i) => (
                                <FontAwesomeIcon key={i} icon={faStar} className="text-red-400 text-lg" />
                            ))}

                            <FontAwesomeIcon icon={faStar} className={blinkingStarClass} />

                        </div>
                    )}






                </div>
            </main>

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center" >
                        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full" >
                            {!isPinVerified ? (
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-2xl text-black font-bold mb-4" > PIN kód megadása </h2>
                                    < input
                                    
                                        type="password"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)
                                        }
                                        className="w-full p-2 border border-black text-black rounded mb-4"
                                        placeholder="Adja meg a PIN kódot"
                                    />
                                    <div className="flex flex-row gap-2" >
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            Mégse
                                        </button>
                                        < button
                                            onClick={handlePinSubmit}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Belépés
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <h2 className="flex flex-row font-bold text-2xl text-black mb-2">
                                        Gyerek kiválasztása
                                    </h2>

                                    <div className="flex flex-row gap-3">
                                        <select
                                            value={selectedPointObject?._id || ''}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const selected = localPointObjects?.find((po) => po._id === selectedId);
                                                setSelectedPointObject(selected);
                                            }}
                                            className="w-full p-2 border rounded text-black"
                                        >
                                            {localPointObjects?.map((pointObject) => (
                                                <option key={pointObject._id} value={pointObject._id}>
                                                    {pointObject.childid}
                                                </option>
                                            ))}
                                        </select>
                                        <button className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600" onClick={() => handleDeletePointObject()}>Gyerek törlése </button>

                                    </div>
                                    <div className="flex flex-row gap-2">
                                        <label className="block text-sm font-medium text-black mb-2">
                                            Gyerek hozzáadása:
                                        </label>
                                        <form
                                            className="flex flex-row gap-2"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                handleAddPointObject(newChildName);
                                                setNewChildName('');
                                            }}
                                        >
                                            <div className="flex flex-col">

                                                <input
                                                    type="text"
                                                    value={newChildName}
                                                    onChange={(e) => setNewChildName(e.target.value)}
                                                    className="w-full p-2 border rounded text-black"
                                                    placeholder="Gyerek neve"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Hozzáad
                                            </button>
                                        </form>


                                    </div>

                                    <div className="flex flex-col">


                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-700 mb-4" > Pontok módosítása </h2>
                                    < div className="flex items-center space-x-4 mb-4" >
                                        <button
                                            onClick={() => handlePointsModification(-1)}
                                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            -1
                                        </button>
                                        < span className="text-xl text-black font-bold" > {selectedPointObject?.points} </span>
                                        < button
                                            onClick={() => handlePointsModification(1)}
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            +1
                                        </button>
                                    </div>
                                    < div className="flex items-center space-x-2 mb-4" >
                                        <input
                                            type="number"
                                            value={pointsToAdd}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10);
                                                setPointsToAdd(isNaN(value) ? 0 : value);
                                            }}
                                            className="w-24 p-2 border rounded text-black"
                                        />
                                        <button
                                            onClick={() => handlePointsModification(pointsToAdd)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Hozzáad
                                        </button>
                                    </div>
                                    <div className="mt-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-black mb-2">
                                                Másodperc / pont (gyűjtés)
                                            </label>
                                            <input
                                                type="number"
                                                value={selectedPointObject?.secondstoaccumulate || 60}
                                                onChange={(e) => setSelectedPointObject(prev => ({ ...prev, secondstoaccumulate: Math.max(1, parseInt(e.target.value) || 60) } as PointsType))}
                                                className="w-full p-2 border rounded text-black"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-black mb-2">
                                                Másodperc / pont (felhasználás)
                                            </label>
                                            <input
                                                type="number"
                                                value={selectedPointObject?.secondstospend || 60}
                                                onChange={(e) => setSelectedPointObject(prev => ({ ...prev, secondstospend: Math.max(1, parseInt(e.target.value) || 60) } as PointsType))}
                                                className="w-full p-2 border rounded text-black"
                                                min="1"
                                            />
                                        </div>
                                    </div>




                                    <button
                                        onClick={closeModal}
                                        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mt-4"
                                    >
                                        Bezárás
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </div>
    )
}


export default MainScreen;
