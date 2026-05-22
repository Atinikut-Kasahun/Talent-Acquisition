<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class CompanyController extends Controller
{
    public function index()
    {
        $companies = Company::orderBy('created_at', 'desc')->get();
        return response()->json($companies);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:companies,name|max:255',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $company = Company::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'website' => $request->website,
            'logo' => $request->logo,
            'is_active' => true,
        ]);

        $admin = Auth::guard('api')->user();

        
        activity()
            ->performedOn($company)
            ->causedBy($admin)
            ->log("Created sister company: {$company->name}");

        return response()->json($company, 210);
    }

    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|unique:companies,name,' . $id . '|max:255',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|string|max:255',
            'is_active' => 'sometimes|required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $company->update($request->all());

        $admin = Auth::guard('api')->user();

        
        activity()
            ->performedOn($company)
            ->causedBy($admin)
            ->log("Updated sister company details for: {$company->name}");

        return response()->json($company);
    }

    public function destroy($id)
    {
        $company = Company::findOrFail($id);
        $companyName = $company->name;
        $company->delete();

        $admin = Auth::guard('api')->user();

        
        activity()
            ->performedOn($company)
            ->causedBy($admin)
            ->log("Deleted sister company: {$companyName}");

        return response()->json(['message' => 'Company successfully deleted']);
    }
}
