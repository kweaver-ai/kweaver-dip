package util

import (
	"fmt"
	"reflect"
)

//value 获取结构体或者map的值
func value(k, v reflect.Value) reflect.Value {
	if v.Kind() == reflect.Map {
		return v.MapIndex(k)
	}
	if v.Kind() == reflect.Struct {
		key := fmt.Sprintf("%v", k.Interface())
		return v.FieldByName(key)
	}
	if v.Kind() == reflect.Interface {
		vv := reflect.ValueOf(v.Interface())
		return value(k, vv)
	}
	return reflect.ValueOf(nil)
}

//keys 获取结构体或者map的值
func keys(v reflect.Value) []reflect.Value {
	if v.Kind() == reflect.Map {
		return v.MapKeys()
	}
	if v.Kind() == reflect.Struct {
		fs := make([]reflect.Value, 0, v.NumField())
		tv := v.Type()
		for i := 0; i < tv.NumField(); i++ {
			fs = append(fs, reflect.ValueOf(tv.Field(i).Name))
		}
		return fs
	}
	if v.Kind() == reflect.Slice {
		fs := make([]reflect.Value, 0, v.Len())
		for i := 0; i < v.Len(); i++ {
			fs = append(fs, v.Index(i))
		}
		return fs
	}
	if v.Kind() == reflect.Interface {
		return keys(reflect.ValueOf(v.Interface()))
	}
	if v.Kind() == reflect.Pointer {
		return keys(v.Elem())
	}

	fmt.Printf("type kind %s", v.Kind().String())
	return nil
}

//value 获取结构体或者map的值
func set(m, v, k reflect.Value) {
	if m.Kind() == reflect.Map {
		m.SetMapIndex(k, v)
	}
	if m.Kind() == reflect.Struct {
		m.Set(v)
	}
	if m.Kind() == reflect.Interface {
		set(reflect.ValueOf(m.Interface()), v, k)
	}
	if m.Kind() == reflect.Pointer {
		set(m.Elem(), v, k)
	}
	return
}

func copyMap(sval, dval reflect.Value) error {
	dkeys := keys(dval)

	for i := 0; i < len(dkeys); i++ {
		//获取dst的类型和key
		dikey := dkeys[i]
		dival := value(dikey, dval)
		ditype := dival.Kind()
		//以dst的key和类型为准， 查找src的
		sival := value(dikey, sval)
		sitype := sival.Kind()

		//fmt.Printf("P1: dikey %v, ditype %v, dival %v; sitype %v, sival %v. \n", dikey.String(), ditype.String(),
		//	dival.Interface(), sitype.String(), sival.Interface())
		if !sival.IsValid() {
			return fmt.Errorf("copy to %s error: key %s not matched", dikey.String(), dikey.String())
		}

		if ditype == reflect.Interface {
			dival = reflect.ValueOf(dival.Interface())
			ditype = dival.Kind()
			//fmt.Printf("P2: dikey %v, ditype %v, dival %v; sitype %v, sival %v. \n", dikey.String(), ditype.String(),
			//	dival.Interface(), sitype.String(), sival.Interface())
		}
		if sitype == reflect.Interface {
			sival = reflect.ValueOf(sival.Interface())
			sitype = sival.Kind()
			//fmt.Printf("P3: dikey %v, ditype %v, dival %v; sitype %v, sival %v. \n", dikey.String(), ditype.String(),
			//	dival.Interface(), sitype.String(), sival.Interface())
		}
		if sitype.String() != ditype.String() {
			return fmt.Errorf("copy to %s error:  value type %s not matched", dikey.String(), ditype.String())
		}
		if ditype == reflect.Slice {
			if err := copySlice(sival, dival, dikey, dval); err != nil {
				return err
			}
			continue
		}
		if ditype == reflect.Map || ditype == reflect.Struct {
			if err := copyMap(sival, dival); err != nil {
				return err
			}
			continue
		}
		set(dval, sival, dikey)
	}
	return nil
}

func CopyStruct(src, dst interface{}) error {
	sval := reflect.ValueOf(src)
	dval := reflect.ValueOf(dst)
	return copyMap(sval, dval)
}

func copySlice(sval, dval, dikey, dpval reflect.Value) error {
	parentSval := sval
	parentDval := dval

	currentSval := parentSval.Index(0)
	currentDval := parentDval.Index(0)
	currentSvalType := currentSval.Kind()
	currentDvalType := currentDval.Kind()

	dvalSlice := make([]reflect.Value, 0)
	dvalSlice = append(dvalSlice, dval)

	for {
		//src和dst同时递进
		dvalSlice = append(dvalSlice, currentDval)
		currentDvalType = currentDval.Kind()
		if currentDvalType == reflect.Interface {
			currentDval = reflect.ValueOf(currentDval.Interface())
			currentDvalType = currentDval.Kind()
		}
		currentSvalType = currentSval.Kind()
		if currentSvalType == reflect.Interface {
			currentSval = reflect.ValueOf(currentSval.Interface())
			currentSvalType = currentSval.Kind()
		}
		if currentDvalType != currentSvalType {
			return fmt.Errorf("src %v and dst %v not matched", currentSval.Interface(), currentDval.Interface())
		}
		if currentDvalType == reflect.Slice {
			parentSval = currentSval
			parentDval = currentDval
			currentSval = currentSval.Index(0)
			currentDval = currentDval.Index(0)
			continue
		}
		//排除最后一个
		dvalSlice = dvalSlice[:len(dvalSlice)-1]
		break
	}
	//结构体值类的，挨个拷贝
	vs := make([]any, 0)
	for j := parentSval.Len() - 1; j >= 0; j-- {
		//fmt.Printf("copy value %v\n", parentSval.Index(j).Interface())
		if currentDvalType != reflect.Map && currentDvalType != reflect.Struct {
			if j == 0 {
				parentDval.Index(j).Set(parentSval.Index(j))
			}
			if j > 0 {
				vs = append(vs, parentSval.Index(j).Interface())
			}
			continue
		}
		demo := parentDval.Index(0)
		if err := copyMap(parentSval.Index(j), demo); err != nil {
			return fmt.Errorf("copy %s to %s slice value %v copy error", parentSval.Type().Name(),
				parentDval.Type().Name(), parentSval.Index(j).Interface())
		}
		if j > 0 {
			vs = append(vs, newStruct(demo).Interface())
		}
	}
	if len(vs) > 0 {
		parentDval = reflect.AppendSlice(parentDval, reflect.ValueOf(vs))
	}
	if len(dvalSlice) < 2 {
		set(dpval, parentDval, dikey)
		return nil
	}
	for i := 0; i+1 < len(dvalSlice); i++ {
		dvalItem := dvalSlice[i]
		dvalItemNext := dvalSlice[i+1]
		//最后一个是跟新的数据
		if i+1 == len(dvalSlice)-1 {
			dvalItemNext = parentDval
		}
		dvalItem.Index(0).Set(dvalItemNext)
	}
	set(dpval, dvalSlice[0], dikey)
	return nil
}

func newStruct(v reflect.Value) reflect.Value {
	if v.Kind() == reflect.Pointer {
		v = v.Elem()
	}
	if v.Kind() == reflect.Interface {
		v = reflect.ValueOf(v.Interface())
	}
	if v.Kind() != reflect.Map {
		return v
	}
	md := make(map[string]any)
	instance := reflect.ValueOf(md)

	keys := v.MapKeys()
	for i := 0; i < len(keys); i++ {
		instance.SetMapIndex(keys[i], v.MapIndex(keys[i]))
	}
	return instance
}
