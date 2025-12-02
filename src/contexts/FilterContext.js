import { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const useFilter = () => {
    return useContext(FilterContext);
};

export const FilterProvider = ({ children }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const changeMonth = (increment) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setSelectedDate(newDate);
    };

    const selectMonth = (monthIndex) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(monthIndex);
        setSelectedDate(newDate);
    };

    const selectYear = (increment) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(newDate.getFullYear() + increment);
        setSelectedDate(newDate);
    };

    return (
        <FilterContext.Provider value={{ selectedDate, changeMonth, selectMonth, selectYear }}>
            {children}
        </FilterContext.Provider>
    );
};
