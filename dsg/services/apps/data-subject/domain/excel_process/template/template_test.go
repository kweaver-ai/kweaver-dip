package template

import (
	"fmt"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"testing"
)

func Test_ttt(t *testing.T) {
	file, err := ioutil.ReadFile("./main_business_form.yaml")
	if err != nil {
		fmt.Printf("Read conf File error :%v", err)
	}
	templates := new(Templates)
	err = yaml.Unmarshal(file, &templates)
	if err != nil {
		fmt.Printf("Unmarshal conf File error :%v", err)
	}
	for _, v1 := range templates.Templates {
		fmt.Println(v1.Name)
		for _, v2 := range v1.Components {
			fmt.Println(v2)
		}
		fmt.Println("---")
	}
}
