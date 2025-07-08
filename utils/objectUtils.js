const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el]; //find req body values one by one using key word, then check allowedFields included in this element. if include set the key element to the new object. after all return the new object
    });
    return newObj;
};

const objectUtils = {
    filterObj,
};
export default objectUtils;